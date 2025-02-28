import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { pluralize } from "../../utils/string.utils";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { Sound, SoundBoardSaveState } from "./sound-board.savestate";


const SORT_BY_VALUES = {
    ADDED_AT: 'addedAt',
    REPRODUCTION_COUNT: 'reproductionCount',
    ADDED_BY: 'addedBy',
} as const;

type SORT_BY = typeof SORT_BY_VALUES[keyof typeof SORT_BY_VALUES];

export class SoundBoardListCommand extends Command {

    command: string = "list";
    alternativeCommands = ["l"];

    usageDescription = "<sound_key>\t -> Lista os áudios do soundboard";

    private stateSaver: StateSaver<SoundBoardSaveState> = new JSONStateSaver<SoundBoardSaveState>();

    protected async isValid(_chat: Chat, _msg: Message, ..._argsArray: string[]): Promise<boolean> {
       return true;
    }

    async handle(_client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const contactId = await extractContactId(msg);

        const [sortBy, sortDirection = 'desc'] = argsArray;

        let soundBoardState = await this.stateSaver.load('soundboard');
        if(!soundBoardState) {
            await msg.reply("Não há sons no soundboard!", contactId);
            return;
        }

        const soundsEntry = Object.entries(soundBoardState);
        soundsEntry.sort(this.getSortFunction(sortBy, { requester: contactId }));

        const soundList = soundsEntry.map(([key, sound]) => {
            return `${key} - ${sound.description? sound.description : 'Nenhuma descrição fornecida'} - ${pluralize(sound.reproductionCount, 'reprodução', 'reproduções', 'Nenhuma')}`;
        });

        const message = soundList.join('\n');
        await msg.reply(message, contactId);
        await msg.react('👍');

    }

    private getSortFunction(sortBy: string, extraOptions: ExtraOptions){
        switch(sortBy) {
            case SORT_BY_VALUES.REPRODUCTION_COUNT:
                return (a: [string, Sound], b: [string, Sound]) => a[1].reproductionCount - b[1].reproductionCount;
            case SORT_BY_VALUES.ADDED_BY:
                return (a: [string, Sound], b: [string, Sound]) => a[1].addedBy.localeCompare(b[1].addedBy);
            case SORT_BY_VALUES.ADDED_AT:
            default:
                return (a: [string, Sound], b: [string, Sound]) => a[1].addedAt - b[1].addedAt;
        }
    }

    get isV2(): boolean {
        return true;
    }

}

interface ExtraOptions {
    requester: string;
}