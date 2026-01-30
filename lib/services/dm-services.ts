import { Client, ContactId, GroupChatId, Message } from "@open-wa/wa-automate";
import fs from "fs/promises";
import fs_simple from "fs";
import OwnerServices from "../utils/owner-services";
import SaveLogsServices from "../utils/save-logs-services";
import ConstantMessage from "../constants/dev-messages";
import { MessageServices } from "../interfaces/message-services";

export default class DmServices implements MessageServices {
    private root: string = process.cwd();
    private file: string = "dm_block.json";
    private users: string = `${this.root}/lib/data/users`;
    private joinFile: string = `${this.users}/${this.file}`;
    private msg: ConstantMessage = new ConstantMessage();

    // override
    public validateCommand(message: Message): boolean {
        return !message.chat.isGroup;
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        let logs: SaveLogsServices = new SaveLogsServices(message);
        try {
            await this.listening(message, bot, logs);
        } catch (err) {
            await logs.saveLogError(err);
        }
    }

    private async listening(
        message: Message,
        bot: Client,
        logs: SaveLogsServices,
    ): Promise<void> {
        await this.createBlockFileIfNotExist();

        let senderId: ContactId = message.sender.id;

        let owner: OwnerServices = new OwnerServices(senderId);

        let isOwner: boolean = await owner.isOwner();

        let isBlock: boolean = await this.isBlockDm(senderId, isOwner);

        if (!isOwner && !isBlock) {
            await bot.sendText(message.from, this.msg.programmer_msg);
            await bot.createGroup("new group1", senderId);
            await logs.saveLogInfo(`${message.notifyName} bloqueado da DM...`);
        }
    }

    private async isBlockDm(
        senderId: ContactId,
        isOwner: boolean,
    ): Promise<boolean> {
        if (isOwner) return false;
        let readFile: any = await fs.readFile(this.joinFile);
        let dm: any = JSON.parse(readFile);
        if (dm.includes(senderId)) return true;
        dm.push(senderId);
        await fs.writeFile(this.joinFile, JSON.stringify(dm));
        return false;
    }

    private async createBlockFileIfNotExist(): Promise<void> {
        let isExist: boolean = fs_simple.existsSync(this.users);
        if (isExist) return;
        await fs.mkdir(this.users);
        await fs.writeFile(this.joinFile, "[]");
    }
}
