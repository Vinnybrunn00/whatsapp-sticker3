import { Message, Client, ContactId } from "@open-wa/wa-automate";
import GroupParticipantAction from "../group-participants-actions-";

export default class DemoteParticipant extends GroupParticipantAction {
    // extends
    protected command: string = "!demote";

    // extends
    protected async action(
        message: Message,
        bot: Client,

        contactId: string,
    ): Promise<void> {
        await bot.demoteParticipant(
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
        return `${message.notifyName} despromoveu ${contactId} no grupo ${groupName}`;
    }
}
