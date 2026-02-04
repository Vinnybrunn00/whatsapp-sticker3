import { Client, Message } from "@open-wa/wa-automate";
import { MessageServices } from "../../../interfaces/message-services";
import SaveLogsServices from "../../../utils/save-logs-services";
import ConstantMessage from "../../../constants/dev-messages";

export default class LinkGroupInvite implements MessageServices {
    private command: string = "!getLink";

    private devMsg = new ConstantMessage();

    //override
    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        const logs = new SaveLogsServices(message);
        try {
            let msg: string = this.messageBuildSucess(message);
            await this.getLinkGroupInvite(message, bot);
            logs.saveLogInfo(msg);
        } catch (err) {
            await bot.reply(message.from, this.devMsg.needAdmbot, message.id);
            logs.saveLogError(`${err} - ${this.devMsg.needAdmbot}`);
        }
    }

    private async getLinkGroupInvite(
        message: Message,
        bot: Client,
    ): Promise<void> {
        if (!message.isGroupMsg) return;
        const linkInvite: string = await bot.getGroupInviteLink(
            message.chat.groupMetadata.id,
        );
        await bot.reply(message.from, linkInvite, message.id);
    }

    private messageBuildSucess(message: Message): string {
        return `${message.notifyName} Solicitou o link do grupo ${message.chat.groupMetadata["subject"]}`;
    }
}
