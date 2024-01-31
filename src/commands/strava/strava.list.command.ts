import { Chat, Client, Message } from "whatsapp-web.js";
import { StravaService } from "../../services/strava.service";
import { bold } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class StravaListCommand extends Command {
    
    command: string = "ver";
    description: string = "Lista o ranking do Strava para o grupo registrado para o chat";


    async handle(client: Client, chat: Chat, msg: Message, ...[command, ...argsArray]: string[]): Promise<void> {

        let response = await StravaService.requestLeaderBoard("1205599");
        const leadboard = response.data.sort((a, b) => a.rank - b.rank)
        const messages = leadboard.map(item => `${bold(item.rank + "º")} - ${item.athlete_firstname} ${item.athlete_lastname} - ${StravaService.asHoursAndMinutes(item.moving_time)} - ${(item.distance / 1000).toFixed(1)}km`)
        await msg.reply(messages.join('\n'));

        return

    }

}