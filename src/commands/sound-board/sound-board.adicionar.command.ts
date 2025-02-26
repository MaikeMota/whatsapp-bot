import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { bold, extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { SoundBoardSaveState } from "./sound-board.savestate";

export class SoundBoardAddCommand extends Command {

    command: string = "adicionar";
    alternativeCommands = ["add"];

    usageDescription = "<sound_key>\t-> Adiciona um áudio ao soundboard";

    private stateSaver: StateSaver<SoundBoardSaveState> = new JSONStateSaver<SoundBoardSaveState>();

    protected async isValid(_chat: Chat, _msg: Message, ..._argsArray: string[]): Promise<boolean> {
       return true;
    }

    async handle(_client: Client, _chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const contactId = await extractContactId(msg);

        const [soundKey] = argsArray;

        if(!soundKey) {
            await msg.reply("Você precisa informar uma chave para adicionar um som!", contactId);
            return;
        }
        const referencedMessage = await msg.getQuotedMessage();

        const hasReferencedMediaMessage = !!referencedMessage && referencedMessage.hasMedia;
        let isMediaValid = false;
        let media = null;
        if(hasReferencedMediaMessage) {
            media = await referencedMessage.downloadMedia();
            isMediaValid = media?.mimetype.split("/")[0] === 'audio';
        }

        if(!hasReferencedMediaMessage || !isMediaValid) {
            await (referencedMessage || msg).reply("Você precisa usar o comando respondendo uma mensagem de áudio!", contactId);
            return;
        }

        let soundBoardState = await this.stateSaver.load('soundboard');
        if(!soundBoardState) {
            soundBoardState = {};
        }

        const alreadExists = !!soundBoardState[soundKey];
        if(alreadExists) {
            await referencedMessage.reply(`Já existe um som com a chave '${bold(soundKey)}' no soundboard!`, contactId);
            return;
        }

        soundBoardState[soundKey] = {
            data: media.data,
            addedBy: contactId,
            addedAt: Date.now()
        }

        await this.stateSaver.save('soundboard', soundBoardState);
        await referencedMessage.reply(`O Som com a chave '${bold(soundKey)}' foi adicionado com sucesso!
Para usa-lo, use o comando ${bold(`${this.parentCommand.command} ${soundKey}`)}`, contactId);


    }

    get isV2(): boolean {
        return true;
    }

}