import { Chat, Message } from "@open-wa/wa-automate";
import fs_promises from "fs/promises";
import fs from "fs";
import path from "path";

const dirPath = path.resolve(__dirname, "../logs/");
const logFile = path.resolve(dirPath, "logfile.log");

export default class SaveLogsServices {
    private message: Message;

    public constructor(message: Message) {
        this.message = message;
    }

    private get chat(): Chat {
        return this.message.chat;
    }

    private get timerLog(): string {
        const now = new Date();

        const date = new Intl.DateTimeFormat("pt-BR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(now);

        const time = new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).format(now);

        return `${date.replace(/\//g, ".")} ${time.replace(/:/g, ".")}`;
    }

    public async saveLogError(erroLog: string): Promise<void> {
        await this.createFileFolder();
        let args: string = `${this.timerLog}: ERROR - [> ${erroLog} <] "${this.chat.name}"`;
        await fs_promises.writeFile(logFile, args + "\n", { flag: "a" });
    }

    public async saveLogInfo(doing: string): Promise<void> {
        await this.createFileFolder();
        let infoLog: string = `${this.timerLog}: INFO - [log] ➜ ${doing}`;
        await fs_promises.writeFile(logFile, infoLog + "\n", { flag: "a" });
        return;
    }

    private async createFileFolder(): Promise<void> {
        if (fs.existsSync(dirPath)) return;
        if (fs.existsSync(logFile)) return;

        await fs_promises.mkdir(dirPath, { recursive: true });

        try {
            await fs_promises.access(logFile);
        } catch {
            await fs_promises.writeFile(
                logFile,
                `Log-file | HubberBot\n${"-".repeat(50)}\n`,
            );
        }
    }
}
