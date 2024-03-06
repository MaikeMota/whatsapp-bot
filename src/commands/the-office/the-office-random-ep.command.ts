import { Client, GroupChat, Message } from "whatsapp-web.js";

import { Command } from "../command";


import { TheOfficeAPI, TheOfficeService } from "../../services/the-office/the-office.service";
import { randomIntFromInterval } from "../../utils/util";
import { bold } from "../../utils/whatsapp.util";

export class TheOfficeRandomEpCommand extends Command {
    command: string = "random-ep";
    alternativeCommands: string[] = ["ep"];


    usageDescription = "\t-> Retorna um Episódio aleatório do the office"

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {
        const season = randomIntFromInterval(1, TheOfficeAPI.TOTAL_SEASONS);
        const seasonEpisodes = await TheOfficeService.getSeason(season);

        const episode = seasonEpisodes[randomIntFromInterval(0, seasonEpisodes.length - 1)];

        const text = `Episódio aleatório de The Office: S${episode.season}E${episode.episode} - ${episode.imdbRating}/10 no IMDB
    ${bold(episode.title)}
    ${bold(episode.description)}`;
        console.log(text)
        await msg.reply(text);
    }
}