import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command.interface";

import { getTaxaSelic } from "../services/selic.service";
import { formatToNumber } from "brazilian-values";


export class SelicCommand implements Command {
    command = '/selic';
    alternativeCommands = [];
    usage = '/selic';
    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        return true;
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const selicRate = await getTaxaSelic();
        await msg.reply(`Atualmente a taxa selic é ${formatToNumber(selicRate.toFixed(2))}%.`)
    }
}