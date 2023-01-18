import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../utils/json-state-saver";
import { Command } from "./command.interface";

import { DateTime } from 'luxon';



const START_COMMANDS = ["start"];
const STOP_COMMANDS = ["stop"];

const AVAILABLE_SUBCOMMANDS = [...START_COMMANDS, ...STOP_COMMANDS]

interface TrackerCommandSaveState {
    startDate: number,
    description?: string
}

export class TrackerCommand implements Command {

    private stateSaver: StateSaver<TrackerCommandSaveState> = new JSONStateSaver<TrackerCommandSaveState>();

    command = '/tracker';
    alternativeCommands = [];
    usage = ``;
    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [firstArg] = argsArray;
        return AVAILABLE_SUBCOMMANDS.includes(firstArg);
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const [firstArg] = argsArray;
        const args = argsArray.splice(1)
        if (START_COMMANDS.includes(firstArg)) {
            await this.handleStartCommand(chat, msg, ...args);
        } else if (STOP_COMMANDS.includes(firstArg)) {
            await this.handleStopCommand(chat, msg, ...args);
        }
    }

    private async handleStartCommand(chat: Chat, msg: Message, ...argsArray: string[]) {
        const [key, ...descriptionAsArray] = argsArray;
        const stateKey = this.resolveKey(chat.id._serialized, key);
        const status = await this.stateSaver.load(stateKey);
        if (status) {
            await msg.reply(`Já existe um tracking para a chave '${key}'`);
            return;
        }

        const state: TrackerCommandSaveState = {
            startDate: Date.now(),
            description: descriptionAsArray.join(' ')
        }

        this.stateSaver.save(stateKey, state);
        msg.reply(`Tracking iniciado com sucesso!`);
    }

    private async handleStopCommand(chat: Chat, msg: Message, ...argsArray: string[]) {
        const [key] = argsArray;
        const stateKey = this.resolveKey(chat.id._serialized, key);
        const status = await this.stateSaver.load(stateKey);
        if (!status) {
            await msg.reply(`Não existe um tracking para a chave '${key}'`);
            return;
        }


        const startDate = DateTime.fromMillis(status.startDate);

        const obj = DateTime.fromMillis(Date.now())
            .diff(startDate, ["years", "months", "days", "hours", 'minutes'])
            .toObject();

        const { years, months, days, hours, minutes } = obj

        let timeElapsed = `${years ? years + ' Anos, ' : ''}${months ? months + ' Meses, ' : ''}${days} Dias, ${hours} Horas, ${minutes.toFixed(0)} Minutos!'`

        await msg.reply(`Finalizando tracking para a chave '${key}'.

${status.description ? status.description + '\n' : ''}
Tempo Decorrido: ${timeElapsed} `)

        await this.stateSaver.remove(stateKey);

    }

    private resolveKey(id: string, key: string) {
        return `tracking-${id}-${key}`;
    }
}
