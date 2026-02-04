import { Client, Message } from "@open-wa/wa-automate";

import GroupParticipantAction from "./contract/group-participants-actions-";

export default class SetDescriptionGroup extends GroupParticipantAction {
    // extends
    protected command: string = "!setDesc";

    // extends
    protected async action(
        message: Message,
        bot: Client,
        argument: string,
    ): Promise<void> {
        await bot.setGroupDescription(
            message.chat.groupMetadata.id,
            argument,
        );
    }

    // override
    protected extractArgument(message: Message): string | null {
        return message.body.slice(this.command.length + 1);
    }

    // extends
    protected buildMessage(message: Message, groupName: string): string {
        return `${message.notifyName} alterou a descrição do grupo ${groupName}`;
    }
}
