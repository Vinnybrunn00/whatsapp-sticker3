import { Client, Message } from "@open-wa/wa-automate";
import SaveLogsServices from "../utils/save-logs-services";
import path from "path";
import { MessageServices } from "../interfaces/message-services";

const dirPath: string = path.resolve(__dirname, "../logs/");
const logFile: string = path.resolve(dirPath, "logfile.log");

export default class LogsServices implements MessageServices {
    private command: string = "!getlog";

    // override
    public validateCommand(message: Message): boolean {
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        await this.sendLogFile(message, bot);
    }

    private async sendLogFile(message: Message, bot: Client): Promise<void> {
        if (!message.chat.isGroup) return;

        const log: SaveLogsServices = new SaveLogsServices(message);

        await bot.sendFile(
            message.from,
            logFile,
            "logfile",
            "• Arquivo de logs de eventos do bot!",
        );

        await log.saveLogInfo(`${message.notifyName} Solicitou o arquivo de log...`);
    }
}
