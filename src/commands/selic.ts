import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

import { formatToNumber } from "brazilian-values";
import { getTaxaSelic } from "../services/selic.service";


export class SelicCommand extends Command {
    command = '/selic';
    
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const selicRate = await getTaxaSelic();
        await msg.reply(`Atualmente a taxa selic é ${formatToNumber(selicRate.toFixed(2))}%.`)
    }
}