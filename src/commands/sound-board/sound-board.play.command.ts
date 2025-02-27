import { Chat, Client, Message, MessageMedia } from "whatsapp-web.js";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { bold, extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { SoundBoardSaveState } from "./sound-board.savestate";

export class SoundBoardPlayCommand extends Command {

    command: string = "play";
    alternativeCommands = ["p"];

    usageDescription = "<sound_key> \t -> Executa um áudio do soundboard";

    private stateSaver: StateSaver<SoundBoardSaveState> = new JSONStateSaver<SoundBoardSaveState>();

    protected async isValid(_chat: Chat, _msg: Message, ..._argsArray: string[]): Promise<boolean> {
       return true;
    }

    async handle(_client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const contactId = await extractContactId(msg);

        const referencedMessage = await msg.getQuotedMessage();

        const [soundKey] = argsArray;

        if(!soundKey) {
            await msg.reply("Você precisa informar uma chave para tocar um som!", contactId);
            return;
        }

        let soundBoardState = await this.stateSaver.load('soundboard');
        if(!soundBoardState) {
            soundBoardState = {};
        }

        const exists = !!soundBoardState[soundKey];
        if(!exists) {
            await msg.reply(`Não existe um som com a chave '${bold(soundKey)}' no soundboard!`, contactId);
            return;
        }

        const sound = new MessageMedia(soundBoardState[soundKey].mimetype || 'audio/mpeg', soundBoardState[soundKey].data);
        console.log(`Playing sound ${soundKey}`);
        await (referencedMessage || msg).reply("", chat.id._serialized, { media: sound });
        console.log(`Sound ${soundKey} sent`);
    }

    get isV2(): boolean {
        return true;
    }

}