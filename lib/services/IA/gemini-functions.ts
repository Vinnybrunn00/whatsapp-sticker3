import { Client, Message } from "@open-wa/wa-automate";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ConstantMessage from "../../constants/dev-messages";
import "dotenv/config";
import { MessageServices } from "../../interfaces/message-services";
import SaveLogsServices from "../../utils/save-logs-services";

const genIA = new GoogleGenerativeAI(process.env.GEN_API_KEY as string);

export default class GeminiFunctions implements MessageServices {
    private msg: ConstantMessage = new ConstantMessage();
    private _content: string;
    private mentionMap: string[];

    public constructor(__message: Message) {
        this.mentionMap = Object.keys(__message["mentionMap"]);
        this._content = __message.body.slice(16);
    }

    private get content(): string {
        return this._content;
    }

    private set content(value: string) {
        this._content = value;
    }

    private get isEmpty(): boolean {
        return this.content.length === 0;
    }

    private get isNotMentioned(): boolean {
        return this.mentionMap.length === 0;
    }

    private get itsMe(): string {
        return this.mentionMap[0];
    }

    private get isMetaIA() {
        return this.mentionMap[0] === "@867051314767696";
    }

    // override
    public validateCommand(message: Message): boolean {
        return message.body.startsWith(this.itsMe);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        let logs: SaveLogsServices = new SaveLogsServices(message);
        try {
            await this.responseBot(message, bot);
            await logs.saveLogInfo("O gemini respondeu alguém.");
        } catch (_) {
            await logs.saveLogError("Erro ao interagir com um usuário");
        }
    }

    private async responseBot(message: Message, bot: Client): Promise<void> {
        if (this.isNotMentioned || this.isMetaIA) return;
        if (this.isEmpty) this.content = this.msg.sendHiGemini;
        await bot.simulateTyping(message.from, true);
        let response: string = await this.reponseText(this.content);
        await bot.reply(message.from, response, message.id);
    }

    private async reponseText(content: string): Promise<string> {
        const model = genIA.getGenerativeModel({
            model: "gemini-3-flash-preview",
        });
        let result = await model.generateContent(content);
        return result.response.text();
    }
}
