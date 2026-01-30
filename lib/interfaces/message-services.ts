import { Client, Message } from "@open-wa/wa-automate";

export interface MessageServices {
    validateCommand(message: Message): boolean;
    handle(message: Message, bot: Client): Promise<void>;
}
