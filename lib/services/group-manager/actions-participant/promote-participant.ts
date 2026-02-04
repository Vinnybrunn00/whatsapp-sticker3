import { Client, ContactId, Message } from "@open-wa/wa-automate";
import GroupParticipantAction from "./contract/group-participants-actions-";

export default class PromoteParticipant extends GroupParticipantAction {
    // extends
    protected command: string = "!promote";

    // extends
    protected async action(
        message: Message,
        bot: Client,
        contactId: string,
    ): Promise<void> {
        await bot.promoteParticipant(
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
        return `${message.notifyName} promoveu ${contactId} no grupo ${groupName}`;
    }
}
