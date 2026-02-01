import { Client, Message } from "@open-wa/wa-automate";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

import ConstantMessage from "../../constants/dev-messages";
import SaveLogsServices from "../../utils/save-logs-services";
import { MessageServices } from "../../interfaces/message-services";

const genIA = new GoogleGenerativeAI(process.env.GEN_API_KEY as string);
const BOT_ID = process.env.BOT_ID;

export default class GeminiFunctions implements MessageServices {
    private readonly msg = new ConstantMessage();

    // override
    public validateCommand(message: Message): boolean {
        const mention = this.getFirstMention(message);
        if (!mention) return false;
        return message.body.startsWith(mention);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        const logs = new SaveLogsServices(message);

        try {
            await this.replyWithGemini(message, bot);
            await logs.saveLogInfo("Gemini respondeu o usuário.");
        } catch (error) {
            await logs.saveLogError("Erro ao interagir com o Gemini.");
        }
    }

    private async replyWithGemini(
        message: Message,
        bot: Client,
    ): Promise<void> {
        const mention = this.getFirstMention(message);

        if (!mention) return;
        if (this.isBotMention(mention)) return;

        const content = this.extractContent(message.body, mention);

        await bot.simulateTyping(message.from, true);

        const response = await this.generateResponse(
            content || this.msg.sendHiGemini,
        );
        const markdownWhatsapp = this.markdownToWhatsapp(response);

        await bot.reply(message.from, markdownWhatsapp, message.id);
    }

    private getFirstMention(message: Message): string | null {
        const mentions = Object.keys(message["mentionMap"] ?? {});
        return mentions.length ? mentions[0] : null;
    }

    private isBotMention(mention: string): boolean {
        return BOT_ID ? mention === BOT_ID : false;
    }

    private extractContent(body: string, mention: string): string {
        return body.replace(mention, "").trim();
    }

    private async generateResponse(content: string): Promise<string> {
        const model = genIA.getGenerativeModel({
            model: "gemini-3-flash-preview",
        });
        const result = await model.generateContent(content);
        return result.response.text();
    }

    private markdownToWhatsapp(text: string): string {
        if (!text) return text;

        let result = text;

        result = result.replace(
            /```([\s\S]*?)```/g,
            (_, code) => `\`\`\`${code.trim()}\`\`\``,
        );
        result = result.replace(/`([^`\n]+)`/g, "```$1```");
        result = result.replace(/\*\*(.*?)\*\*/g, "*$1*");
        result = result.replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, "$1_$2_");
        result = result.replace(/~~(.*?)~~/g, "~$1~");
        result = result.replace(/^[\s]*[-*]\s+/gm, "• ");
        return result.trim();
    }
}
