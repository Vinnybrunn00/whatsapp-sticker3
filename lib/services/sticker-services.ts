import { Client, decryptMedia, Message } from "@open-wa/wa-automate";

import SaveLogsServices from "../utils/save-logs-services";
import Utils from "../utils/utils";
import { MessageServices } from "../interfaces/message-services";

type ContentToImage = {
    author: string;
    keepScale: boolean;
    pack: string;
};

type ContentToVideo = {
    author: string;
    pack: string;
};

type EndTime = {
    endTime: string;
};

export default class StickerWithImageVideoServices implements MessageServices {
    private command: string = "!sticker";
    private contentToImage: ContentToImage;
    private contentToVideo: ContentToVideo;
    private endTime: EndTime = { endTime: "00:00:07.0" };
    private utils: Utils = new Utils();

    // override
    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        if (message.type === "chat") return false;
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
            console.log(err);
            await logs.saveLogError(err);
            await bot.reply(message.from, err, message.id);
        }
    }

    private async sendStickerNormal(
        message: Message,
        bot: Client,
        logs: SaveLogsServices,
    ): Promise<void> {
        let contentToImage: ContentToImage = {
            author: `Feito por: ${message.notifyName}`,
            keepScale: true,
            pack: "hubberBot",
        };

        let contentToVideo: ContentToVideo = {
            author: `Feito por: ${message.notifyName}`,
            pack: "hubberBot",
        };

        let sticker: string = await this.sendResolveSticker(
            message,
            bot,
            undefined,
        );

        if (message.type === "image") {
            await bot.sendImageAsSticker(
                message.from,
                sticker,
                contentToImage,
            );
            await logs.saveLogInfo(
                `${message.notifyName} gerou uma figurinha com imagem...`,
            );
            return;
        }

        await bot.sendMp4AsSticker(
            message.from,
            sticker,
            this.endTime,
            contentToVideo,
        );
        await logs.saveLogInfo(
            `${message.notifyName} gerou uma figurinha com video...`,
        );
    }

    private async sendStickerQuotedMsgMimetype(
        message: Message,
        bot: Client,
        logs: SaveLogsServices,
    ): Promise<void> {
        let quotedType = message.quotedMsg.type;
        if (quotedType !== "image" && quotedType !== "video") return;

        let sticker: string = await this.sendResolveSticker(
            message,
            bot,
            message.quotedMsg,
        );

        if (quotedType !== "video") {
            await bot.sendImageAsSticker(
                message.from,
                sticker,
                this.contentToImage,
            );
            await logs.saveLogInfo(
                `${message.notifyName} gerou uma figurinha com imagem...`,
            );
            return;
        }
        await bot.sendMp4AsSticker(
            message.from,
            sticker,
            this.endTime,
            this.contentToVideo,
        );
        await logs.saveLogInfo(
            `${message.notifyName} gerou uma figurinha com video...`,
        );
    }

    private async sendResolveSticker(
        message: Message,
        bot: Client,
        quotedMsg: any,
    ): Promise<string> {
        await bot.sendReplyWithMentions(
            message.from,
            this.sendRequestSticker(message),
            message.id,
        );
        let decryp: Message | any =
            quotedMsg === undefined ? message : quotedMsg;
        let mimetype: any =
            quotedMsg === undefined ? message.mimetype : quotedMsg.mimetype;
        const decrypt: Buffer<ArrayBufferLike> = await decryptMedia(decryp);
        return `data:${mimetype};base64,${decrypt.toString("base64")}`;
    }

    private sendRequestSticker(message: Message): string {
        return (
            `\`\`\`[${this.utils.timerHour}] - ` +
            `Solicitado por ${message.notifyName}\`\`\`\n\n` +
            `Aguarde... ⌛`
        );
    }
}
