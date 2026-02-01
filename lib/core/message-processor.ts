import { Client, Message } from "@open-wa/wa-automate";
import { MessageServices } from "../interfaces/message-services";
import StickerWithImageVideoServices from "../services/sticker-services";
import DmServices from "../services/dm-services";
import MentionAllServices from "../services/mention-services";
import LogsServices from "../services/logs-services";
import VoiceServices from "../services/voice-services";
import YTDownloadServices from "../services/ytdownload-services";
import ShellServices from "../services/shell-services";
import GeminiFunctions from "../services/IA/gemini-functions";
import AddParticipant from "../services/group-manager/actions-participant/add-participant";
import DemoteParticipant from "../services/group-manager/actions-participant/demote-participant";
import RemoveParticipant from "../services/group-manager/actions-participant/remove-participants";
import PromoteParticipant from "../services/group-manager/actions-participant/promote-participant";
import SetDescriptionGroup from "../services/group-manager/actions-group/set-description-group";

export default class MessageProcessor {
    private services: MessageServices[];

    constructor(message: Message) {
        this.services = [
            new LogsServices(),
            new DmServices(),
            new StickerWithImageVideoServices(),
            new MentionAllServices(),
            new VoiceServices(),
            new YTDownloadServices(),
            new ShellServices(),
            new GeminiFunctions(),
            new AddParticipant(),
            new RemoveParticipant(),
            new PromoteParticipant(),
            new DemoteParticipant(),
            new SetDescriptionGroup(),
        ];
    }

    public async process(message: Message, bot: Client): Promise<void> {
        for (let service of this.services) {
            if (!service.validateCommand(message)) continue;
            await service.handle(message, bot);
        }
    }
}
