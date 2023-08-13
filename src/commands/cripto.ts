import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

import { getCriptoInfo, getSymbolFor } from "../services/fcs-api.service";

export class CriptoCommand extends Command {
    command = '/cripto';
    usageDescription = '<pair> - Mostra o preço de uma criptomoeda.\n\nExemplo:\n\n/cripto btc\n/cripto btc/usd';
    
    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        if (!argsArray.length) {
            return false;
        }
        const [args] = argsArray;
        const [symbol] = args.split('/');
        return !!symbol;
    }
    
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const [args] = argsArray;
        let [pair1, pair2] = args.split('/');
        if (!pair2) {
            pair2 = 'brl'
        }

        const ticker = `${pair1}/${pair2}`;
        const tickInfo = await getCriptoInfo(ticker)

        if (!tickInfo) {
            msg.reply(`Não consegui encontrar informações sobre o preço de ${ticker}`);
            return
        }

        const lastUpdateDate = new Date(tickInfo.lastUpdate * 1000)
        const horaAtualizacao = lastUpdateDate.toLocaleTimeString()
        const symbol = getSymbolFor(pair2)
        msg.reply(this.getMessageForUser(ticker, symbol, tickInfo, horaAtualizacao))
    }

    private getMessageForUser(ticker, symbol, tickInfo, horaAtualizacao) {
        return `*${ticker.toUpperCase()}*: *${symbol} ${tickInfo.c}* (${tickInfo.cp})
    
    Mínima: ${symbol} ${tickInfo.l}
    Máxima: ${symbol} ${tickInfo.h}
    
    *Última atualização às ${horaAtualizacao}...*`;
    }

}
