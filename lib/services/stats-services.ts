import { Message, Client } from "@open-wa/wa-automate";
import { MessageServices } from "../interfaces/message-services";
import fs from "fs/promises";

export default class StatsHostServices implements MessageServices {
    private command: string = "!stats";
    private root: string = process.cwd();
    private file: string = "stats.json";
    private statsPathDir: string = `${this.root}/lib/data/stats`;
    private statsFilePath: string = `${this.statsPathDir}/${this.file}`;

    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return message.body.startsWith(this.command);
    }

    public async handle(message: Message, bot: Client): Promise<void> {
        await this.getStatsHost(message, bot);
    }

    private async getStatsHost(message: Message, bot: Client): Promise<void> {
        const stats: string = (await bot.getProcessStats()) as string;
        if (!stats) return;

        let stringify: string = JSON.stringify(stats);

        await fs.mkdir(this.statsPathDir, { recursive: true });
        await fs.writeFile(this.statsFilePath, stringify);

        await bot.sendFile(
            message.from,
            this.statsFilePath,
            this.file,
            "stats",
        );
    }
}
