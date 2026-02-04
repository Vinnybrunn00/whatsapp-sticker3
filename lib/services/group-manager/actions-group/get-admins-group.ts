import { Message, Client, ContactId } from "@open-wa/wa-automate";
import { MessageServices } from "../../../interfaces/message-services";
import OwnerServices from "../../../utils/owner-services";
import Utils from "../../../utils/utils";
import SaveLogsServices from "../../../utils/save-logs-services";

export default class GetAdminsGroup implements MessageServices {
    private command: string = "!getAdmins";
    private utils: Utils = new Utils();

    // override
    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        const logs = new SaveLogsServices(message);
        try {
            let msg: string = this.messageBuildSucess(message);
            await this.getAdminsGroup(message, bot);
            logs.saveLogInfo(msg);
        } catch (err) {
            logs.saveLogError(err);
        }
    }

    private async getAdminsGroup(
        message: Message,
        bot: Client,
    ): Promise<void> {
        const owner = new OwnerServices(message.sender.id);

        if (!owner.isOwner()) return;

        const admins = await bot.getGroupAdmins(
            message.chat.groupMetadata.id,
        );

        let contacts: string[] = [];

        for (let i = 0; i < admins.length; i++) {
            const adm: ContactId = admins[i];
            let newAdmin = adm.replace("@c.us", "");
            contacts.push(`@${newAdmin}\n`);
        }

        await bot.simulateTyping(message.from, true);
        await bot.sendReplyWithMentions(
            message.from,
            this.bannerAdmins(message, contacts.toString(), admins.length),
            message.id,
        );
    }

    private bannerAdmins(
        message: Message,
        admins: string,
        count: number,
    ): string {
        return [
            "------〘 _ADMINS MENCIONADOS_ 〙 ------",
            "",
            `\`\`\`[${this.utils.timerHour}]\`\`\` ➣ *${message.chat.name}*`,
            `➣ *${count} Admins*`,
            "",
            admins.replace(/,/g, ""),
        ].join("\n");
    }

    private messageBuildSucess(message: Message): string {
        return `${message.notifyName} marcou todos os admins no grupo ${message.chat.groupMetadata["subject"]}`;
    }
}
