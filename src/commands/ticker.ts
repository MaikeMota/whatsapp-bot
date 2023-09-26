import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

import { getAvailableTickersFor } from "../services/brapi.service";
import { getStockInfo } from "../services/fcs-api.service";
import { StockInfo } from "../services/stock-info.interface";
import { hasCategorySuffix, sortByMostNegativeDailyChange, tickerInfoToOneLineString } from "../utils/ticker.util";


const availableTickerFor = new Map<string, string[]>();

export class TickerCommand extends Command {
    command = '/ticker';
    alternativeCommands = ['/cotação'];

    usageDescription = '<ticker> - Obtem a cotação do ativo. Exemplo: /ticker bbas3';

    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [ticker] = argsArray;
        return !!ticker;
    }

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const ticker = argsArray[0];

        if (!hasCategorySuffix(ticker)) {
            let tickersToAdd = availableTickerFor.get(ticker)
            if (!tickersToAdd || tickersToAdd.length === 0) {
                tickersToAdd = await getAvailableTickersFor(ticker);
                availableTickerFor.set(ticker, tickersToAdd);
            }
            argsArray = [...argsArray.filter(a => a !== ticker), ...tickersToAdd]
        }

        if (!argsArray.length) {
            msg.reply(`Não consegui nenhum ticker com o prefixo *${ticker}*`);
            return;
        }

        const isMultiple = argsArray.length > 1

        if (isMultiple) {

            let tickersMessage = await this.handleMultipleTickers(argsArray);
            await msg.reply(`${tickersMessage}`)
            return

        }

        const [args] = argsArray;
        const ticksInfo = await getStockInfo([args]);
        const tickInfo = ticksInfo.success[0];
        if (!tickInfo) {
            msg.reply(`Não consegui encontrar informações sobre o preço de ${args}`);
            return;
        }
        await msg.reply(this.getTickerMessage(tickInfo));

    }

    private async handleMultipleTickers(argsArray: string[]): Promise<string> {
        let tickersToRequest = [];
        for (const ticker of argsArray) {
            if (!hasCategorySuffix(ticker)) {
                let tickersToAdd = availableTickerFor.get(ticker)
                if (!tickersToAdd || tickersToAdd.length === 0) {
                    tickersToAdd = await getAvailableTickersFor(ticker);
                    availableTickerFor.set(ticker, tickersToAdd);
                }
                tickersToRequest = [...tickersToRequest.filter(a => a !== ticker), ...tickersToAdd]
            } else {
                tickersToRequest.push(ticker);
            }
        }
        const results = await getStockInfo(tickersToRequest);

        let tickersMessage = "";
        for (const result of results.success.sort(sortByMostNegativeDailyChange)) {
            tickersMessage += this.getOneLineTickerMessage(result) + "\n";
        }
        return tickersMessage;
    }

    private getOneLineTickerMessage(tickInfo) {
        return tickerInfoToOneLineString(tickInfo)
    }

    private getTickerMessage(stockInfo: StockInfo) {
        return `*${stockInfo.businessName}*
${stockInfo.ticker.toUpperCase()}: *R$ ${stockInfo.price.toFixed(2).replace('.', ',')}* (${stockInfo.dailyChangeInPercent > 0 ? '+' : ''}${stockInfo.dailyChangeInPercent.toFixed(2).replace('.', ',')}%)
    
    Mínima: R$ ${stockInfo.lowPrice.toFixed(2).replace('.', ',')}
    Máxima: R$ ${stockInfo.highPrice.toFixed(2).replace('.', ',')}
    Mínima 52 semanas: R$ ${stockInfo.low52WeekPrice.toFixed(2).replace('.', ',')}
    Maxima 52 semanas: R$ ${stockInfo.high52WeekPrice.toFixed(2).replace('.', ',')}
    
    *Última atualização às ${new Date(stockInfo.lastUpdate).toLocaleTimeString()}...* `;
    }
}