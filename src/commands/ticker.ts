import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command.interface";

const { getStockInfo } = require("../services/fcs-api.service");


export class TickerCommand implements Command {
    command = '/ticker';
    alternativeCommands = ['/cotação'];
    usage = '/ticker tickerDaEmpresa';
    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [args] = argsArray;
        const [ticker] = args.split(' ');
        return !!ticker;
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const isMultiple = argsArray.length > 1

        if (isMultiple) {

            const results = await getStockInfo(argsArray);

            let tickersMessage = ""
            for (const result of results) {
                tickersMessage += this.getOneLineTickerMessage(result) + "\n"
            }

            await msg.reply(`${tickersMessage}`)

        } else {
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
    }

    private getOneLineTickerMessage(tickInfo) {
        return `${tickInfo.ticker.toUpperCase()}: *R$ ${tickInfo.c.replace('.', ',')}* (${parseFloat(tickInfo.cp) > 0 ? '+' : ''}${tickInfo.cp.replace('.', ',')})`
    }

    private getTickerMessage(tickInfo, horaAtualizacao) {
        return `${tickInfo.ticker.toUpperCase()}: *R$ ${tickInfo.c.replace('.', ',')}* (${parseFloat(tickInfo.cp) > 0 ? '+' : ''}${tickInfo.cp.replace('.', ',')})
    
    Mínima: R$ ${tickInfo.l}
    Máxima: R$ ${tickInfo.h}
    
    *Última atualização às ${horaAtualizacao}...* `;
    }
}