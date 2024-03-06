import { Client, GroupChat, Message } from "whatsapp-web.js";

import { Command } from "../command";


import { TheOfficeService } from "../../services/the-office/the-office.service";

export class TheOfficeRandomQuoteCommand extends Command {
    command: string = "quote";
    alternativeCommands: string[] = ["frases", "falas", "citação", "citações"];


    usageDescription = "\t-> Retorna um citação do the office."

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {
        const quote = await TheOfficeService.getRandomQuote();
        console.log(quote)
        await msg.reply(`"${quote.quote}" - ${quote.character}`);
    }
}