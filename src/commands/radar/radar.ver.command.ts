import { Chat, Client, Message } from "whatsapp-web.js";
import { getStockInfo } from "../../services/brapi.service";
import { StockInfo } from "../../services/stock-info.interface";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { sortByMostNegativeDailyChange, tickerInfoToOneLineString } from "../../utils/ticker.util";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { RadarSaveState } from "./radar.savestate";
import { RadarUtil } from "./radar.util";


export class RadarVerCommand extends Command {
    command: string = "ver";

    usageDescription = "\t-> Mostra a cotações das ações em seu Radar"

    private stateSaver: StateSaver<RadarSaveState> = new JSONStateSaver<RadarSaveState>();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        if(chat.id._serialized !== "120363159731656783@g.us") { 
            msg.reply(`Este comando está disponível apenas para o grupo BOT VDA.
    *Acesse o link abaixo para entrar no grupo:*
        https://chat.whatsapp.com/FmBQj0c6hrt8Ko8JdN24PL`)
            return;
        }

        const contactId = await extractContactId(msg);
        const key = RadarUtil.getStateKey(contactId);
        let currentState = await this.stateSaver.load(key);
        if (!currentState || currentState.tickers.length == 0) {
            await msg.reply("Você não possui nenhum ticker registrado no seu radar.");
            return
        }

        const tickersInfo = await getStockInfo(currentState.tickers);
        const message = ["Cotações das empresas do seu Radar:\n"]
        const stockInfos: StockInfo[] = []
        for (const ticker of currentState.tickers) {
            const info = tickersInfo.success.find(ti => ti.ticker === ticker.toUpperCase());
            if (!info) {
                continue;
            }
            stockInfos.push(info)
        }
        stockInfos
            .sort(sortByMostNegativeDailyChange)
            .forEach(info => message.push("\t" + tickerInfoToOneLineString(info)));

        if (tickersInfo.failed.length > 0) {
            message.push("\nNão foi possível recuperar as cotações dos seguintes tickers: " + tickersInfo.failed.join(", "))
        }

        message.push("\n** As cotações demonstradas possuem até 1 hora de atraso.")
        msg.reply(message.join("\n"));
    }

    get isV2(): boolean {
        return true;
    }
}