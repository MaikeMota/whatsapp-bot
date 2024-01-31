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


    async handle(client: Client, chat: Chat, msg: Message, ...[command, ...argsArray]: string[]): Promise<void> {

        const state = await this.stateSaver.load("strava");

        if(!state || !state[chat.id._serialized]){
            await msg.reply("Nenhum grupo registrado para este chat")
            return
        }

        let response = await StravaService.requestLeaderBoard(state[chat.id._serialized]);
        const leadboard = response.data.sort((a, b) => a.rank - b.rank)
        const messages = leadboard.map(item => `${bold(item.rank + "º")} - ${item.athlete_firstname} ${item.athlete_lastname} - ${StravaService.asHoursAndMinutes(item.moving_time)} - ${(item.distance / 1000).toFixed(1)}km`)
        await msg.reply(messages.join('\n'));

        return

    }

}