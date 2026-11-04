import { Client, Message, StickerJob } from "@open-wa/wa-automate";

import SaveLogsServices from "../utils/save-logs-services";
import Utils from "../utils/utils";
import { MessageServices } from "../interfaces/message-services";
import { sendReplyWithMentions } from "../utils/wa-compat";

// vídeos viram figurinha só com os 7 primeiros segundos
const VIDEO_TRIM_MS: [number, number] = [0, 7000];

export default class StickerWithImageVideoServices implements MessageServices {
    private command: string = "!sticker";
    private utils: Utils = new Utils();

    // override
    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return (
            message.caption?.startsWith(this.command) ||
            message.body.startsWith(this.command)
        );
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        let logs: SaveLogsServices = new SaveLogsServices(message);

        try {
            message.type === "image" || message.type === "video"
                ? await this.sendStickerNormal(message, bot, logs)
                : await this.sendStickerQuotedMsgMimetype(message, bot, logs);
        } catch (err) {
            await logs.saveLogError(err);
            await bot.reply(message.from, err, message.id);
        }
    }

    private async sendStickerNormal(
        message: Message,
        bot: Client,
        logs: SaveLogsServices,
    ): Promise<void> {
        let sticker: string = await this.sendResolveSticker(
            message,
            bot,
            undefined,
        );

        await bot.sendSticker(
            message.from,
            sticker,
            this.stickerJob(message, message.type === "video"),
        );
        await logs.saveLogInfo(
            `${message.notifyName} gerou uma figurinha com ${message.type === "video" ? "video" : "imagem"}...`,
        );
    }

    private async sendStickerQuotedMsgMimetype(
        message: Message,
        bot: Client,
        logs: SaveLogsServices,
    ): Promise<void> {
        let quotedMsg: Message = message.quotedMsg;

        if (quotedMsg == null) {
            throw "Este comando precisa de uma image ou video!";
        }

        let quotedType = message.quotedMsg.type;

        if (quotedType !== "image" && quotedType !== "video") return;

        let sticker: string = await this.sendResolveSticker(
            message,
            bot,
            message.quotedMsg,
        );

        await bot.sendSticker(
            message.from,
            sticker,
            this.stickerJob(message, quotedType === "video"),
        );
        await logs.saveLogInfo(
            `${message.notifyName} gerou uma figurinha com ${quotedType === "video" ? "video" : "imagem"}...`,
        );
    }

    private stickerJob(message: Message, isVideo: boolean): StickerJob {
        return {
            author: `Feito por: ${message.notifyName}`,
            pack: "hubberBot",
            fit: "contain",
            ...(isVideo ? { trim: VIDEO_TRIM_MS } : {}),
        };
    }

    private async sendResolveSticker(
        message: Message,
        bot: Client,
        quotedMsg: any,
    ): Promise<string> {
        await sendReplyWithMentions(
            bot,
            message.from,
            this.sendRequestSticker(message),
            message.id,
        );
        let decryp: Message = quotedMsg === undefined ? message : quotedMsg;
        // na v5 o decryptMedia já devolve um data URL
        return bot.decryptMedia(decryp);
    }

    private sendRequestSticker(message: Message): string {
        return (
            `\`\`\`[${this.utils.timerHour}] - ` +
            `Solicitado por ${message.notifyName}\`\`\`\n\n` +
            `Aguarde... ⌛`
        );
    }
}
