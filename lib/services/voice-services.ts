import { Client, Message } from "@open-wa/wa-automate";
import gTTS from "gtts";
import fs from "fs";
import fs_promisse from "fs/promises";
import path from "path";
import { MessageServices } from "../interfaces/message-services";
import SaveLogsServices from "../utils/save-logs-services";

export default class VoiceServices implements MessageServices {
    private command: string = "!voice";
    private root: string = process.cwd();
    private path: string = `${this.root}/voice`;
    private pathVoice: string = path.resolve(this.path, "voice.mp3");

    // override
    public validateCommand(message: Message): boolean {
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        const log: SaveLogsServices = new SaveLogsServices(message);
        try {
            await this.sendVoice(message, bot);
            await log.saveLogInfo(
                `${message.notifyName} solicitou um audio.`,
            );
        } catch (err) {
            await log.saveLogError(err);
            await bot.reply(
                message.from,
                `Erro ao converter áudio, tente: ${this.command} pt text`,
                message.id,
            );
        }
    }

    private async sendVoice(message: Message, bot: Client): Promise<void> {
        let split: string[] = message.body.split(" ");

        if (split.length !== 3) return;

        let lang = split[1];
        let text = split[split.length - 1];

        let isNotValid: boolean =
            lang.length === 0 && text.length < 4 && text.length >= 50;

        if (isNotValid) return;

        let exists: boolean = fs.existsSync(this.path);

        if (!exists) await fs_promisse.mkdir(this.path);
        let gtts = new gTTS(text, "pt");

        await bot.simulateRecording(message.from, true);
        gtts.save(this.pathVoice, async () => {
            await bot.sendPtt(message.from, this.pathVoice, message.id);
        });
    }
}
