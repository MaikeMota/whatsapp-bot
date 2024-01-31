import { Chat, Client, Message } from "whatsapp-web.js";

import { StravaService } from "../../services/strava.service";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { Command } from "../command";

const REGEX_PATTERN = /https:\/\/www\.strava\.com\/clubs\/(?<idFromUrl>[0-9]*)|^(?<id>[0-9]*)$/

interface StravaState {
    [chatId: string]: string
}

export class StravaRegisterCommand extends Command {

    command: string = "registrar";
    description: string = "Comando para registrar o grupo do strava Strava";

    stateSaver: StateSaver<StravaState> = new JSONStateSaver<StravaState>();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const [clubLinkOrId] = argsArray;


        if (REGEX_PATTERN.test(clubLinkOrId)) {
            const matchs = REGEX_PATTERN.exec(clubLinkOrId);
            let id = matchs.groups.idFromUrl || matchs.groups.id;
            try {
                await StravaService.requestLeaderBoard(id);
                let state = await this.stateSaver.load("strava");
                if (!state) {
                    state = {}
                }
                const alreadExists = !!state[chat.id._serialized];
                state[chat.id._serialized] = id;
                this.stateSaver.save("strava", state)
                await msg.reply(`Club (${id}) ${alreadExists ? 'atualizado' : 'registrado'} com sucesso!`)
                return

            } catch (error) {
                await msg.reply(`Não consegui encontrar os dados para o club (${id}) informado.`)
                return
            }

        }

        await msg.reply("Por favor, envie o link do Club ou o ID.")
    }
}