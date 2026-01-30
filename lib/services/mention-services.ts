import { Client, Message } from "@open-wa/wa-automate";
import SaveLogsServices from "../utils/save-logs-services";
import ConstantMessage from "../constants/dev-messages";
import Utils from "../utils/utils";
import { MessageServices } from "../interfaces/message-services";

export default class MentionAllServices implements MessageServices {
    private command: string = "!all";
    private constantMsg: ConstantMessage = new ConstantMessage();
    private utils: Utils = new Utils();

    // override
    public validateCommand(message: Message): boolean {
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        await this.sendMentionAll(message, bot);
    }

    private async sendMentionAll(message: Message, bot: Client): Promise<void> {
        if (!message.isGroupMsg) return;

        let logs: SaveLogsServices = new SaveLogsServices(message);

        let mention: string | undefined = await this.mentionsAll(message, bot);

        if (mention !== undefined) {
            await bot.reply(message.from, mention, message.id);
            await logs.saveLogInfo(`${message.notifyName} Marcou todos do grupo...`);
        }
    }

    private async mentionsAll(
        message: Message,
        bot: Client,
    ): Promise<string | undefined> {
        let users: string[] = [];
        let participants = message.chat.groupMetadata.participants;

        for (let i = 0; i < participants.length; i++) {
            const isAdmin = participants[i]["isAdmin"];

            if (message.author === participants[i]["id"].toString()) {
                if (!isAdmin) {
                    return this.constantMsg.onlyAdmUsedCommand;
                }

                for (let j = 0; j < participants.length; j++) {
                    let members: any = participants[j]["id"];
                    let newMembers = members.replace(/@lid/g, "");
                    users.push(`› *@${newMembers}*\n`);
                }

                users = users;
                await bot.simulateTyping(message.from, true);
                await bot.sendReplyWithMentions(
                    message.from,
                    this.bannerMetionAll(message, users.toString()),
                    message.id,
                );
            }
        }
    }

    private bannerMetionAll(message: Message, listString: string): string {
        return [
            "------〘 _TODOS MENCIONADOS_ 〙 ------",
            "",
            `\`\`\`[${this.utils.timerHour}]\`\`\` ➣ *${message.chat.name}*`,
            `➣ *${message.chat["participantsCount"].toString()} Membros*`,
            "",
            listString.replace(/,/g, ""),
        ].join("\n");
    }
}
