import { Client, Message } from "@open-wa/wa-automate";
import { YtDlp } from "ytdlp-nodejs";
import fs from "fs";
import fs_promises from "fs/promises";
import path from "path";
import { MessageServices } from "../interfaces/message-services";
import SaveLogsServices from "../utils/save-logs-services";

export default class YTDownloadServices implements MessageServices {
    private command: string = "!yt";
    private root: string = process.cwd();
    private path: string = `${this.root}/video`;
    private pathVideo: string = path.resolve(this.path, "video.mkv");
    private isExist: boolean = fs.existsSync(this.path);

    // override
    validateCommand(message: Message): boolean {
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        const log: SaveLogsServices = new SaveLogsServices(message);
        try {
            await this.YTDownload(message, bot);
            await log.saveLogInfo(
                `${message.notifyName} baixou um vídeo do YouTube`,
            );
        } catch (err) {
            await log.saveLogError(err);
            await bot.reply(
                message.from,
                "Erro Inesperado, tente novamente",
                message.id,
            );
        } finally {
            await fs_promises.rm(this.pathVideo);
            await log.saveLogInfo("Video apagado.");
        }
    }

    private async YTDownload(message: Message, bot: Client): Promise<void> {
        let url: string = message.body.slice(4);

        if (!this.isExist) await fs_promises.mkdir(this.path);

        const ytdlp: YtDlp = new YtDlp();
        await bot.reply(message.from, "Baixando o vídeo, aguarde...⌛", message.id);
        await ytdlp.downloadAsync(url, {
            output: this.pathVideo,
        });

        await bot.sendFile(
            message.from,
            this.pathVideo,
            "Completed ✅",
            "video.mp4",
        );
    }
}
