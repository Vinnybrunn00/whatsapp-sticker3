import { Client, ContactId, Message } from "@open-wa/wa-automate";
import GroupParticipantAction from "../group-participants-actions-";

export default class RemoveParticipant extends GroupParticipantAction {
    // extends
    protected command: string = "!remove";

    // extends
    protected async action(
        message: Message,
        bot: Client,
        contactId: string,
    ): Promise<void> {
        await bot.removeParticipant(
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
        return `${message.notifyName} removeu ${contactId} do grupo ${groupName}`;
    }
}
