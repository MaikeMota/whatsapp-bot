import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command.interface";

const { randomIntFromInterval } = require('../utils/util');
const lerolero = require('lerolero');

export class DaniBotCommand implements Command {
    command= '/danibot';
    alternativeCommands= ['!danibot', '/botdani', '!botdani', '/dani', '!dani'];
    usage= '';
    async isValid(chat: Chat, ...argsArray: string[]): Promise<boolean> {
        return true
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        if(!chat.name.includes('Knife') && !chat.name.includes('NEUROSE')){
            return
        }
        const rn = randomIntFromInterval(1, 6);
        const useClassic = rn === 2 || rn === 4;
        let message = "[DaniBot] says: ";
        if (useClassic) {
            message += CLASSICAS_DANI[randomIntFromInterval(0, CLASSICAS_DANI.length - 1)];
        } else {
            message += lerolero()
        }
        await msg.reply(`[DaniBot] says: ${lerolero()}`)
    }
}


const CLASSICAS_DANI = [
    "Para que a respiração ocorra nos peixes, é necessário que a água entre pela boca e saia pelas brânquias, obedecendo a um fluxo unidirecional. Inicialmente a água entra na cavidade bucal e segue em direção aos filamentos branquiais.",
    "Eu acho que o boy deveria analisar randomizado as conversas e pegar algumas palavras chaves e trazer informações do Wolfram alpha sobre o assunto",
    "😂😂😂😂",
    "Vou pro bunker",
    "Cof Cof Cof",
    "*leve palma com atrito entre as maos*"
]