import { Message, Client, ContactId } from "@open-wa/wa-automate";

import { MessageServices } from "../interfaces/message-services";

import fs from "fs/promises";

type ChatLog = {
    notifyName: string;
    body: string;
    groupId: string;
};

export default class LogMessage implements MessageServices {
    private root: string = process.cwd();

    public validateCommand(message: Message): boolean {
        if (message.type !== "chat") return false;
        return message.isGroupMsg;
    }

    public async handle(message: Message): Promise<void> {
        await this.StreamMessage(message);
    }

    private async StreamMessage(message: Message): Promise<void> {
        const chatId = message.chat.groupMetadata.id;
        const chats = `${this.root}/lib/data/chats`;
        const chatPathFull = `${chats}/${chatId}`;

        await fs.mkdir(chats, { recursive: true });

        let list: ChatLog[] = [];

        try {
            let readFile = await fs.readFile(`${chatPathFull}.json`, "utf8");
            list = JSON.parse(readFile);
        } catch (err) {
            if (err.code !== "ENOENT") throw err;
        }

        let contact = message.sender.id.replace("@c.us", "");

        list.push({
            notifyName: `@${contact}`,
            body: message.body,
            groupId: chatId,
        });

        if (list.length > 20) list.shift();

        await fs.writeFile(`${chatPathFull}.json`, JSON.stringify(list));
    }
}
