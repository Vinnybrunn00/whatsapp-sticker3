import { Message, Client } from "@open-wa/wa-automate";
import { MessageServices } from "../../../../interfaces/message-services";
import SaveLogsServices from "../../../../utils/save-logs-services";

export default abstract class GroupParticipantAction implements MessageServices {
    protected abstract command: string;

    // override
    public validateCommand(message: Message): boolean {
        if (!message.isGroupMsg) return false;
        return message.body.startsWith(this.command);
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        let argument: string | null = this.extractArgument(message);

        if (argument === null) {
            const invalidMessage: string = argument.includes("@c.us")
                ? "Contato Inválido"
                : "Argumento Inválido";
            await bot.reply(message.from, invalidMessage, message.id);
            return;
        }

        let logs: SaveLogsServices = new SaveLogsServices(message);

        let groupName: string = message.chat.groupMetadata["subject"];

        try {
            let msg: string = this.buildMessage(message, argument, groupName);
            await this.action(message, bot, argument);
            await logs.saveLogInfo(msg);
        } catch (event) {
            await logs.saveLogError(event);
            const response = this.handleError(event);
            await bot.reply(message.from, response, message.id);
        }
    }

    protected extractArgument(message: Message): string | null {
        const raw = message.body.slice(this.command.length + 1);
        if (raw.length !== 12) return null;
        return `${raw}@c.us`;
    }

    protected abstract action(
        message: Message,
        bot: Client,
        argument: string,
    ): Promise<void>;

    protected abstract buildMessage(
        message: Message,
        contactId: string,
        groupName: string,
    ): string;

    protected handleError(event: any): string {
        switch (event.message) {
            case "NOT_A_GROUP_CHAT":
                return "Não é um chat válido";
            case "GROUP_DOES_NOT_EXIST":
                return "Grupo inexistente";
            case "NOT_A_PARTICIPANT":
                return "Não é um participante válido";
            case "NOT_A_CONTACT":
                return "Não é um contato válido";
            case "INSUFFICIENT_PERMISSIONS":
                return "O bot precisa ser ADM";
            default:
                return "Erro desconhecido, entre em contato com o criador";
        }
    }
}
