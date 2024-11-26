import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

import * as cheerio from 'cheerio';

export class GoblinCommand extends Command {
    command = '/goblin';
    alternativeCommands: string[] = [];

    usageDescription = ''

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const response = await fetch('https://coinmarketcap.com/academy/article/todays-goblin-mine-daily-cipher-code-november-22-2024/').then(r => r.text());

        const $ = cheerio.load(response);

        const matchs = $('h2 + div').text().match(/\[ (?<code>\d{4}) \]/);

        const message = matchs ? `Goblin Mine Daily Cipher Code: ${matchs.groups.code}` : 'Nenhuma chave encontrada.';

        await msg.reply(message);

    }
}
