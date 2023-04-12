import { Chat, Client, Message } from "whatsapp-web.js";
import { getStockInfo } from "../../services/fcs-api.service";
import { tickerInfoToOneLineString } from "../../utils/ticker.util";
import { Command } from "../command";

const BESST = [
    "B - Bancos",
    "E - Energia",
    "S - Saneamento",
    "S - Seguros",
    "T - Telecomunicações"
]

const BESST_TICKERS = [
    ["BBAS3", "SANB3", "SANB4", "SANB11", "ITUB4", "BBDC3", "BBDC4", "ABCB4", "BRSR6"],
    ["TAEE4", "TAEE11", "TRPL4", "AESB3", "AURE3", "VBBR3", "EGIE3", "ALUP11"],
    ["CSMG3", "SAPR4", "SAPR11", "SBSP3"],
    ["BBSE3", "CXSE3", "PSSA3"],
    ["VIVT3", "TIMS3"]
]

export class RadarBESSTCommand extends Command {
    command: string = "besst";
    alternativeCommands: string[] = ["BESST"];

    usageDescription = "\t-> Mostra a cotações das principais empresas do BESST"

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const tickers = BESST_TICKERS.flat()

        const tickersInfo = await getStockInfo(tickers);
        let counter = 0;
        const message = []
        for (const sector of BESST_TICKERS) {
            message.push(`*${BESST[counter++]}*`);
            for(const ticker of sector) {
                const info = tickersInfo.find(ti => ti.ticker === ticker);
                if(!info){ 
                    console.log(`[RadarBesstCommand] Could not find info for ticker ${ticker}`)
                    continue
                }
                message.push("\t" + tickerInfoToOneLineString(info));
            }
        }

        message.push("\n** As cotações demonstradas possuem até 1 hora de atraso.")
        await msg.reply(message.join("\n"));
    }

    get isV2(): boolean {
        return true;
    }
}