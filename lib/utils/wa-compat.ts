import { Client, ContactId, GroupId, MessageId } from "@open-wa/wa-automate";

/*
 * Funções que existiam no Client da v4 do open-wa e não estão mais
 * expostas no Client da v5. Elas rodam dentro da página do WhatsApp Web
 * via bot.evaluate, do mesmo jeito que o próprio Client da v5 faz.
 */

declare const WAPI: any;
declare const Store: any;

/** Mostra "digitando..." no chat. Falha silenciosamente (é só cosmético). */
export async function simulateTyping(
    bot: Client,
    chatId: string,
    on: boolean = true,
): Promise<void> {
    try {
        await bot.evaluate(
            ({ chatId, on }) => WAPI.simulateTyping(chatId, on),
            { chatId, on },
        );
    } catch {}
}

/** Mostra "gravando áudio..." no chat. Falha silenciosamente. */
export async function simulateRecording(
    bot: Client,
    chatId: string,
): Promise<void> {
    try {
        await bot.evaluate(
            ({ chatId }) => WAPI.sendChatstate(1, chatId),
            { chatId },
        );
    } catch {}
}

/** IDs dos admins de um grupo. */
export async function getGroupAdmins(
    bot: Client,
    groupId: GroupId | string,
): Promise<ContactId[]> {
    return bot.evaluate(
        ({ groupId }) => WAPI.getGroupAdmins(groupId),
        { groupId },
    );
}

/** Extrai os "@numero" do texto e transforma em IDs "numero@c.us". */
function mentionsFromText(content: string): string[] {
    const found = content.match(/@(\d{6,})/g) ?? [];
    return Array.from(new Set(found.map((m) => `${m.slice(1)}@c.us`)));
}

/**
 * Responde uma mensagem marcando contatos.
 *
 * O sendReplyWithMentions da v5 exige licença paga, então isto replica
 * o WAPI.reply da v5 adicionando o mentionedJidList. Se `mentions` não
 * for passado, os "@numero" do texto são usados. Se o envio com
 * menções falhar, manda uma resposta normal (sem marcar ninguém).
 */
export async function sendReplyWithMentions(
    bot: Client,
    to: string,
    content: string,
    quotedMsgId: MessageId,
    mentions?: string[],
): Promise<void> {
    const ids = mentions ?? mentionsFromText(content);

    try {
        const sent = await bot.evaluate(
            async ({ to, content, quotedMsgId, ids }) => {
                const chat = Store.Chat.get(to);
                if (!chat) return false;
                const quotedMsg = Store.Msg.get(quotedMsgId);
                const template = Store.Msg.models.filter(
                    (m: any) => m.__x_isSentByMe && !m.quotedMsg,
                )[0];
                if (!template) return false;

                const tempMsg = Object.create(template);
                Object.assign(tempMsg, {
                    ack: 0,
                    id: WAPI.getNewMessageId(to),
                    local: true,
                    self: "out",
                    t: Math.floor(Date.now() / 1000),
                    to: Store.WidFactory.createWid(to),
                    isNewMsg: true,
                    type: "chat",
                    body: content,
                    quotedMsg,
                    ...(quotedMsg
                        ? {
                              quotedParticipant:
                                  quotedMsg.author || quotedMsg.from,
                              quotedStanzaID: quotedMsg.id.id,
                          }
                        : {}),
                    mentionedJidList: ids.map((id: string) =>
                        Store.WidFactory.createWid(id),
                    ),
                });

                const res = await Promise.all(
                    await Store.addAndSendMsgToChat(chat, tempMsg),
                );
                return res[1] === "success";
            },
            { to, content, quotedMsgId, ids },
        );
        if (sent) return;
    } catch {}

    await bot.reply(to as any, content, quotedMsgId);
}
