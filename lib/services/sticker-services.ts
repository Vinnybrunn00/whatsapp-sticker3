import { Client, Message } from "@open-wa/wa-automate";

import SaveLogsServices from "../utils/save-logs-services";
import Utils from "../utils/utils";
import { MessageServices } from "../interfaces/message-services";
import { sendReplyWithMentions } from "../utils/wa-compat";
import { sendMediaAsSticker, StickerOptions } from "../utils/sticker-maker";

// vídeos viram figurinha só com os 7 primeiros segundos
const VIDEO_MAX_SECONDS = 7;

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
            const text =
                typeof err === "string"
                    ? err
                    : "Não consegui gerar a figurinha, tente de novo.";
            await bot.reply(message.from, text, message.id);
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

        await sendMediaAsSticker(
            bot,
            message.from,
            sticker,
            this.stickerOptions(message, message.type === "video"),
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

        if (quotedType !== "image" && quotedType !== "video") {
            throw "Este comando precisa de uma image ou video!";
        }

        let sticker: string = await this.sendResolveSticker(
            message,
            bot,
            message.quotedMsg,
        );

        await sendMediaAsSticker(
            bot,
            message.from,
            sticker,
            this.stickerOptions(message, quotedType === "video"),
        );
        await logs.saveLogInfo(
            `${message.notifyName} gerou uma figurinha com ${quotedType === "video" ? "video" : "imagem"}...`,
        );
    }

    private stickerOptions(message: Message, isVideo: boolean): StickerOptions {
        return {
            author: `Feito por: ${message.notifyName}`,
            pack: "hubberBot",
            isVideo,
            maxSeconds: VIDEO_MAX_SECONDS,
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
