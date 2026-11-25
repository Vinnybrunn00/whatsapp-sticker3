import { existsSync } from "fs";
import { CreateOptions } from "@open-wa/wa-automate";

// No Termux o Node reporta "android" e a v5 não consegue baixar o
// navegador sozinha: é preciso usar o Chromium instalado pelo pkg.
const isTermux: boolean = process.platform === "android";

// o nome do binário muda conforme o pacote (tur-repo, x11-repo...)
function findTermuxChromium(): string {
    const bin = `${process.env.PREFIX ?? "/data/data/com.termux/files/usr"}/bin`;
    const candidates = ["chromium-browser", "chromium"].map((n) => `${bin}/${n}`);
    return candidates.find((p) => existsSync(p)) ?? candidates[0];
}

const termuxChromium: string = isTermux ? findTermuxChromium() : "";

export const config: CreateOptions = {
    sessionId: "wa-bot",
    multiDevice: true,
    authTimeout: 60,
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    logConsole: false,
    popup: !isTermux,
    qrTimeout: 0,
    ...(isTermux
        ? {
              useChromium: true,
              executablePath:
                  process.env.PUPPETEER_EXECUTABLE_PATH || termuxChromium,
          }
        : { useChrome: true }),
};
