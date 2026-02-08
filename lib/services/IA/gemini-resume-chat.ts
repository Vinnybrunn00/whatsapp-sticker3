import { Message, Client } from "@open-wa/wa-automate";
import { MessageServices } from "../../interfaces/message-services";
import fs from "fs/promises";
import GeminiFunctions from "./gemini-functions";
import SaveLogsServices from "../../utils/save-logs-services";

export class GeminiResumeChat
    extends GeminiFunctions
    implements MessageServices
{
    private command: string = "!resume";
    private root: string = process.cwd();

    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return message.body.startsWith(this.command);
    }

    public async handle(message: Message, bot: Client): Promise<void> {
        const logs = new SaveLogsServices(message);
        try {
            await this.getResumeChat(message, bot);
            await logs.saveLogInfo(
                `${message.notifyName} solicitou o resumo do grupo ${message.chat.groupMetadata["subject"]}`,
            );
        } catch (err) {
            await logs.saveLogError(err);
            await bot.reply(
                message.from,
                this.msg.insufficientMessage,
                message.id,
            );
        }
    }

    private async getResumeChat(
        message: Message,
        bot: Client,
    ): Promise<void> {
        const chatId = message.chat.groupMetadata.id;
        const pathChat = `${this.root}/lib/data/chats/${chatId}.json`;

        let readFile = await fs.readFile(pathChat, "utf-8");

        const json: object[] = JSON.parse(readFile);

        if (json.length === 20) {
            await bot.reply(
                message.from,
                this.msg.insufficientMessage,
                message.id,
            );
            return;
        }

        const jsonify = JSON.stringify(json);

        await bot.simulateTyping(message.from, true);

        const response = await this.generateResponse(
            this.promptForGemini(jsonify),
        );

        let markdown: string = this.markdownToWhatsapp(response);

        await bot.sendReplyWithMentions(message.from, markdown, message.id);
    }

    private promptForGemini(response: string): string {
        return (
            "resuma esta conversa com bullet points (-)" +
            "sem dizer nada" +
            "em 3º pessoa" +
            "verbos no passado" +
            "Linguagem neutra" +
            "estilo “observador externo”" +
            "inclua no texto o notifyName" +
            "quebra de linha no fim do topico" +
            `: ${response}`
        );
    }
}
