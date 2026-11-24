import { execFile } from "child_process";
import { existsSync, promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { Client } from "@open-wa/wa-automate";

/*
 * Na v5 do open-wa o bot.sendSticker só funciona com um "patch privado"
 * (licença paga), e o renderizador @open-wa/stickers não aceita vídeo.
 * Aqui a figurinha é gerada com o ffmpeg que já vem junto do open-wa
 * (ffmpeg-static) e enviada pelo WAPI.sendImageAsSticker, que é livre.
 */

declare const WAPI: any;

/*
 * ffmpeg usado na conversão:
 *  1. FFMPEG_PATH, se definido;
 *  2. o binário do ffmpeg-static (Linux/Windows/macOS);
 *  3. o "ffmpeg" do PATH. No Termux o Node reporta "android", o
 *     ffmpeg-static não tem binário e é preciso `pkg install ffmpeg`.
 */
function resolveFfmpeg(): string {
    if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const bundled: string | null = require("ffmpeg-static");
        if (bundled && existsSync(bundled)) return bundled;
    } catch {}
    return "ffmpeg";
}

const ffmpegPath: string = resolveFfmpeg();
const run = promisify(execFile);

const SIZE = 512;
// limites do WhatsApp: ~100KB estática, ~500KB animada
const MAX_STATIC_BYTES = 100 * 1024;
const MAX_ANIMATED_BYTES = 500 * 1024;

// encaixa em 512x512 com bordas transparentes.
// yuva420p em vez de rgba: com rgba o libwebp fica dezenas de vezes mais lento
const FIT_FILTER =
    `scale=${SIZE}:${SIZE}:force_original_aspect_ratio=decrease,` +
    `format=yuva420p,pad=${SIZE}:${SIZE}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`;

export type StickerOptions = {
    author: string;
    pack: string;
    isVideo: boolean;
    /** duração máxima do vídeo, em segundos */
    maxSeconds?: number;
};

/** Converte uma imagem/vídeo (data URL ou Buffer) em figurinha e envia. */
export async function sendMediaAsSticker(
    bot: Client,
    to: string,
    media: string | Buffer,
    options: StickerOptions,
): Promise<void> {
    const input = typeof media === "string" ? dataUrlToBuffer(media) : media;
    const webp = await toStickerWebp(input, options);
    const withExif = addStickerExif(webp, options.pack, options.author);

    const result = await bot.evaluate(
        ({ b64, to, size }) =>
            WAPI.sendImageAsSticker(b64, to, { width: size, height: size }),
        { b64: withExif.toString("base64"), to, size: SIZE },
    );
    if (result === false) {
        throw "Não consegui enviar a figurinha, tente de novo.";
    }
}

function dataUrlToBuffer(dataUrl: string): Buffer {
    const comma = dataUrl.indexOf(",");
    return Buffer.from(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl, "base64");
}

async function toStickerWebp(
    input: Buffer,
    options: StickerOptions,
): Promise<Buffer> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "hubber-sticker-"));
    const inFile = path.join(dir, "input");
    const outFile = path.join(dir, "sticker.webp");

    // tentativas da melhor para a pior qualidade até caber no limite
    const attempts = options.isVideo
        ? [
              { q: 60, fps: 15 },
              { q: 40, fps: 12 },
              { q: 25, fps: 10 },
              { q: 15, fps: 8 },
          ]
        : [{ q: 80 }, { q: 60 }, { q: 40 }, { q: 20 }];
    const limit = options.isVideo ? MAX_ANIMATED_BYTES : MAX_STATIC_BYTES;

    try {
        await fs.writeFile(inFile, input);
        let out: Buffer;
        for (const attempt of attempts) {
            const args = options.isVideo
                ? [
                      "-y", "-i", inFile,
                      "-t", String(options.maxSeconds ?? 7),
                      "-vf", `fps=${(attempt as any).fps},${FIT_FILTER}`,
                      "-an", "-c:v", "libwebp_anim", "-loop", "0",
                      "-q:v", String(attempt.q), "-compression_level", "4",
                      "-f", "webp", outFile,
                  ]
                : [
                      "-y", "-i", inFile,
                      "-vf", FIT_FILTER, "-frames:v", "1",
                      "-c:v", "libwebp", "-q:v", String(attempt.q),
                      "-compression_level", "4",
                      "-f", "webp", outFile,
                  ];
            await run(ffmpegPath, ["-hide_banner", "-loglevel", "error", ...args], {
                maxBuffer: 10 * 1024 * 1024,
            });
            out = await fs.readFile(outFile);
            if (out.length <= limit) break;
        }
        return out;
    } finally {
        await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
}

/**
 * Coloca o nome do pack e o autor no WebP (chunk EXIF que o WhatsApp lê).
 * Garante o chunk VP8X, obrigatório para ter EXIF.
 */
export function addStickerExif(webp: Buffer, pack: string, author: string): Buffer {
    if (webp.toString("ascii", 0, 4) !== "RIFF" || webp.toString("ascii", 8, 12) !== "WEBP") {
        throw new Error("Arquivo WebP inválido");
    }

    const json = Buffer.from(
        JSON.stringify({
            "sticker-pack-id": `hubberbot-${Date.now()}`,
            "sticker-pack-name": pack,
            "sticker-pack-publisher": author,
            emojis: [""],
        }),
        "utf8",
    );
    const tiff = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0, 0, 0, 0,
        0x16, 0x00, 0x00, 0x00,
    ]);
    tiff.writeUInt32LE(json.length, 14);
    const exif = Buffer.concat([tiff, json]);

    // separa os chunks, descartando EXIF antigo
    const chunks: { fourcc: string; data: Buffer }[] = [];
    for (let off = 12; off + 8 <= webp.length; ) {
        const fourcc = webp.toString("ascii", off, off + 4);
        const size = webp.readUInt32LE(off + 4);
        const data = webp.subarray(off + 8, off + 8 + size);
        if (fourcc !== "EXIF") chunks.push({ fourcc, data });
        off += 8 + size + (size & 1);
    }

    if (chunks[0]?.fourcc === "VP8X") {
        const vp8x = Buffer.from(chunks[0].data);
        vp8x[0] |= 0x08; // flag EXIF
        chunks[0] = { fourcc: "VP8X", data: vp8x };
    } else {
        const { width, height, alpha } = simpleWebpInfo(chunks[0]);
        const vp8x = Buffer.alloc(10);
        vp8x[0] = 0x08 | (alpha ? 0x10 : 0);
        vp8x.writeUIntLE(width - 1, 4, 3);
        vp8x.writeUIntLE(height - 1, 7, 3);
        chunks.unshift({ fourcc: "VP8X", data: vp8x });
    }
    chunks.push({ fourcc: "EXIF", data: exif });

    const body = Buffer.concat(
        chunks.map(({ fourcc, data }) => {
            const header = Buffer.alloc(8);
            header.write(fourcc, 0, "ascii");
            header.writeUInt32LE(data.length, 4);
            return Buffer.concat([header, data, Buffer.alloc(data.length & 1)]);
        }),
    );
    const riff = Buffer.alloc(12);
    riff.write("RIFF", 0, "ascii");
    riff.writeUInt32LE(4 + body.length, 4);
    riff.write("WEBP", 8, "ascii");
    return Buffer.concat([riff, body]);
}

function simpleWebpInfo(chunk?: { fourcc: string; data: Buffer }) {
    if (chunk?.fourcc === "VP8L") {
        const bits = chunk.data.readUInt32LE(1);
        return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >>> 14) & 0x3fff) + 1,
            alpha: true,
        };
    }
    if (chunk?.fourcc === "VP8 ") {
        return {
            width: chunk.data.readUInt16LE(6) & 0x3fff,
            height: chunk.data.readUInt16LE(8) & 0x3fff,
            alpha: false,
        };
    }
    return { width: SIZE, height: SIZE, alpha: true };
}
