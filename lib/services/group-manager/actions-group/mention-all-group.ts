import { Client, Contact, ContactId, Message } from "@open-wa/wa-automate";
import SaveLogsServices from "../../../utils/save-logs-services";
import ConstantMessage from "../../../constants/dev-messages";
import Utils from "../../../utils/utils";
import { MessageServices } from "../../../interfaces/message-services";

export default class MentionAllGroup implements MessageServices {
    private command: string = "!all";
    private constantMsg: ConstantMessage = new ConstantMessage();
    private utils: Utils = new Utils();

    // override
    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        await this.sendMentionAll(message, bot);
    }

    private async sendMentionAll(
        message: Message,
        bot: Client,
    ): Promise<void> {
        let logs: SaveLogsServices = new SaveLogsServices(message);

        let mention: string | undefined = await this.mentionsAll(
            message,
            bot,
        );

        if (mention !== undefined) {
            await bot.reply(message.from, mention, message.id);
            await logs.saveLogInfo(
                `${message.notifyName} Marcou todos do grupo...`,
            );
        }
    }

    private async mentionsAll(
        message: Message,
        bot: Client,
    ): Promise<string | undefined> {
        let users: string[] = [];

        const groupMetadata = message.chat.groupMetadata;

        let participants = groupMetadata.participants;

        for (let i = 0; i < participants.length; i++) {
            if (message.author !== participants[i]["id"].toString()) {
                const isAdmin = participants[i]["isAdmin"];

                if (!isAdmin) return this.constantMsg.onlyAdmUsedCommand;

                const contacts: Contact[] = await bot.getGroupMembers(
                    groupMetadata.id,
                );

                for (let j = 0; j < contacts.length; j++) {
                    if (contacts[j]["isMe"]) continue;
                    let members: ContactId = contacts[j]["id"];
                    let newMembers = members.replace("@c.us", "");
                    users.push(`› *@${newMembers}*\n`);
                }

                await bot.simulateTyping(message.from, true);
                await bot.sendReplyWithMentions(
                    message.from,
                    this.bannerMetionAll(message, users.toString()),
                    message.id,
                );
            }
        }
    }

    private bannerMetionAll(message: Message, members: string): string {
        return [
            "------〘 _TODOS MENCIONADOS_ 〙 ------",
            "",
            `\`\`\`[${this.utils.timerHour}]\`\`\` ➣ *${message.chat.name}*`,
            `➣ *${message.chat["participantsCount"].toString()} Membros*`,
            "",
            members.replace(/,/g, ""),
        ].join("\n");
    }
}
