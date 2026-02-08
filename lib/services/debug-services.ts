import { Message, Client } from "@open-wa/wa-automate";
import { MessageServices } from "../interfaces/message-services";
import OwnerServices from "../utils/owner-services";
import ConstantMessage from "../constants/dev-messages";
import SaveLogsServices from "../utils/save-logs-services";

export default class DebugServices implements MessageServices {
    private command: string = "$debug";
    private msg: ConstantMessage = new ConstantMessage();

    // override
    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        const logs = new SaveLogsServices(message);
        try {
            await this.onStatusBot(message, bot);
            await logs.saveLogInfo(`${message.notifyName} usou o debug`);
        } catch (err) {
            await logs.saveLogError(err);
        }
    }

    private async onStatusBot(message: Message, bot: Client): Promise<void> {
        const owner = new OwnerServices(message.sender.id);

        if (!owner.isOwner()) {
            await bot.reply(
                message.from,
                this.msg.onlyAdmUsedCommand,
                message.id,
            );
            return;
        }
        await bot.reply(
            message.from,
            `\`\`\`[200] - OK 🤖 ✔️ \`\`\``,
            message.id,
        );
    }
}
