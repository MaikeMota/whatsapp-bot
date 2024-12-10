import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

import { formatToBRL } from "brazilian-values";
import { getCriptoInfo } from "../services/fcs-api.service";
import { CriptoInfo } from "../services/stock-info.interface";
import { asPercentageString } from "../utils/string.utils";

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
        if(!pair2){ 
            pair2 = 'brl'
        }

        const ticker = `${pair1}/${pair2}`;
        const tickInfo = await getCriptoInfo(ticker)

        if (!tickInfo) {
            msg.reply(`Não consegui encontrar informações sobre o preço de ${ticker}`);
            return
        }
        msg.reply(this.getMessageForUser(ticker, tickInfo))
    }

    private getMessageForUser(ticker: string, tickInfo: CriptoInfo) {
        const lastUpdateDate = new Date(tickInfo.lastUpdate * 1000)
        const horaAtualizacao = lastUpdateDate.toLocaleTimeString()
        return `*${ticker.toUpperCase()}*: *${formatToBRL(tickInfo.price)}* (${asPercentageString(tickInfo.dailyChangeInPercent)})
    
    Mínima: ${formatToBRL(tickInfo.lowPrice)}
    Máxima: ${formatToBRL(tickInfo.highPrice)}
    
    *Última atualização às ${horaAtualizacao}...*`;
    }

}
