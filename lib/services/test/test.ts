import { Message, Client } from "@open-wa/wa-automate";
import { MessageServices } from "../../interfaces/message-services";

import GeminiFunctions from "../IA/gemini-functions";

export default class Test extends GeminiFunctions implements MessageServices {
    private command: string = "____!resume";
    private root: string = process.cwd();

    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return message.body.startsWith(this.command);
    }

    public async handle(message: Message, bot: Client): Promise<void> {}

    private async test(message: Message, bot: Client): Promise<void> {}
}
