import { Client, ContactId, Message } from "@open-wa/wa-automate";
import GroupParticipantAction from "./contract/group-participants-actions-";

export default class AddParticipant extends GroupParticipantAction {
    // extends
    protected command: string = "!add";

    // extends
    protected async action(
        message: Message,
        bot: Client,
        contactId: string,
    ): Promise<void> {
        await bot.addParticipant(
            message.chat.groupMetadata.id,
            contactId as ContactId,
        );
    }

    // extends
    protected buildMessage(
        message: Message,
        contactId: string,
        groupName: string,
    ): string {
        return `${message.notifyName} adicionou ${contactId} ao grupo ${groupName}`;
    }
}
