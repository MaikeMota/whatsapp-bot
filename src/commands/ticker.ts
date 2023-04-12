import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

import { getStockInfo } from "../services/fcs-api.service";
import { hasCategorySuffix, tickerInfoToOneLineString } from "../utils/ticker.util";


export class TickerCommand extends Command {
    command = '/ticker';
    alternativeCommands = ['/cotação'];
    
    usageDescription = '<ticker> - Obtem a cotação do ativo. Exemplo: /ticker bbas3';

    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [ticker] = argsArray;
        return !!ticker && hasCategorySuffix(ticker);
    }
    
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const isMultiple = argsArray.length > 1

        if (isMultiple) {

            let tickersMessage = await this.handleMultipleTickers(argsArray);
            await msg.reply(`${tickersMessage}`)
            return

        }

        const [args] = argsArray;

        const ticker = args.toLowerCase();
        const ticksInfo = await getStockInfo([ticker]);
        const tickInfo = ticksInfo[0];
        if (!tickInfo) {
            msg.reply(`Não consegui encontrar informações sobre o preço de ${ticker}`);
            return;
        }
        const lastUpdateDate = new Date(tickInfo.t * 1000);
        const horaAtualizacao = lastUpdateDate.toLocaleTimeString();

        await msg.reply(this.getTickerMessage(tickInfo, horaAtualizacao));

    }

    private async handleMultipleTickers(argsArray: string[]): Promise<string> {
        const results = await getStockInfo(argsArray);

        let tickersMessage = "";
        for (const result of results) {
            tickersMessage += this.getOneLineTickerMessage(result) + "\n";
        }
        return tickersMessage;
    }

    private getOneLineTickerMessage(tickInfo) {
        return tickerInfoToOneLineString(tickInfo)
    }

    private getTickerMessage(tickInfo, horaAtualizacao) {
        return `${tickInfo.ticker.toUpperCase()}: *R$ ${tickInfo.c.replace('.', ',')}* (${parseFloat(tickInfo.cp) > 0 ? '+' : ''}${tickInfo.cp.replace('.', ',')})
    
    Mínima: R$ ${tickInfo.l}
    Máxima: R$ ${tickInfo.h}
    
    *Última atualização às ${horaAtualizacao}...* `;
    }
}