import { create, Client, Message } from "@open-wa/wa-automate";
import { config } from "./config/config";
import MessageProcessor from "./core/message-processor";

create(config).then((bot: Client) => {
    start(bot);
});

function start(bot: Client): void {
    bot.onMessage(async (message: Message) => {
        const messageProcessor = new MessageProcessor();
        await messageProcessor.process(message, bot);
    });
}
