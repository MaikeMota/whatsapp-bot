import { Chat, Client, Message } from "whatsapp-web.js";
import { StravaService } from "../../services/strava.service";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { bold } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { StravaState } from "./strava.state";

export class StravaListCommand extends Command {

    command: string = "ver";
    description: string = "Lista o ranking do Strava para o grupo registrado para o chat";

    stateSaver: StateSaver<StravaState> = new JSONStateSaver<StravaState>();


    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const [id] = argsArray;

        const state = await this.stateSaver.load("strava");
        const clubId = id || state[chat.id._serialized]
        if (!clubId) {
            await msg.reply("Nenhum grupo registrado para este chat")
            return
        }

        try {
            let response = await StravaService.requestLeaderBoard(clubId);
            if (response.data.length === 0) {
                await msg.reply(`Não há dados de atividades nesta semana para este grupo (${clubId}).`)
                return
            }

            const leadboard = response.data.sort((a, b) => a.rank - b.rank)
            const messages = leadboard.map(item => `${bold(item.rank + "º")} - ${item.athlete_firstname} ${item.athlete_lastname} - ${StravaService.asHoursAndMinutes(item.moving_time)} - ${(item.distance / 1000).toFixed(1)}km`)
            await msg.reply(messages.join('\n'));
        } catch (error) {
            await msg.reply(`Erro ao buscar dados do Strava para o grupo ${id}.
${error.message}`)
        }

    }
}