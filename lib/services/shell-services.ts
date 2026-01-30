import shell, { cat } from "shelljs";
import OwnerServices from "../utils/owner-services";
import { Client, Message } from "@open-wa/wa-automate";
import { MessageServices } from "../interfaces/message-services";
import SaveLogsServices from "../utils/save-logs-services";

export default class ShellServices implements MessageServices {
    private command: string = "!exec";

    // override
    public validateCommand(message: Message): boolean {
        return message.body.startsWith("!exec");
    }

    // override
    public async handle(message: Message, bot: Client): Promise<void> {
        let logs: SaveLogsServices = new SaveLogsServices(message);
        try {
            await this.execShellScript(message, bot);
            await logs.saveLogInfo(`${message.notifyName} usou o !exec`);
        } catch (err) {
            await logs.saveLogError(err);
            await bot.reply(
                message.from,
                "Algo deu errado, tente novamente.",
                message.id,
            );
        }
    }

    private async execShellScript(message: Message, bot: Client): Promise<void> {
        let owner: OwnerServices = new OwnerServices(message.sender.id);

        if (!owner.isOwner()) {
            await bot.reply(message.from, "Sem permissão", message.id);
        }

        let args: string = message.body.slice(6);

        const result = shell.exec(args, { windowsHide: true });

        if (result.code !== 0) {
            await bot.reply(message.from, "Comando não excutado", message.id);
        }

        if (result.stdout.length !== 0) {
            await bot.reply(message.from, result.stdout, message.id);
        }
    }
}
