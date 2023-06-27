import { Chat, Client, Message } from "whatsapp-web.js";
import { getStockInfo } from "../../services/fcs-api.service";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { tickerInfoToOneLineString } from "../../utils/ticker.util";
import { Command } from "../command";

const BESST = [
    "B - Bancos",
    "E - Energia",
    "S - Saneamento",
    "S - Seguros",
    "T - Telecomunicações"
]
const CACHE_TIME = 1000 * 60 * parseInt((process.env.RADAR_BESST_COMMAND_INTERVAL_IN_MINUTES || `10`))

export class RadarBESSTCommand extends Command {
    command: string = "besst";
    alternativeCommands: string[] = ["BESST"];

    usageDescription = "\t-> Mostra a cotações das principais empresas do BESST"

    private stateSaver: StateSaver<Array<string[]>> = new JSONStateSaver<Array<string[]>>();

    private lastLoadedState: Array<string[]>;
    private lastLoadedTime: number = 0;



    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (chat.id._serialized !== "120363159731656783@g.us") {
            msg.reply(`Este comando está disponível apenas para o grupo BOT VDA.
    *Acesse o link abaixo para entrar no grupo:*
        https://chat.whatsapp.com/FmBQj0c6hrt8Ko8JdN24PL`)
            return;
        }
        const currState = await this.getState();

        const tickers = currState.flat();

        const tickersInfo = await getStockInfo(tickers);
        let counter = 0;
        const message = []
        for (const sector of currState) {
            message.push(`*${BESST[counter++]}*`);
            for (const ticker of sector) {
                const info = tickersInfo.find(ti => ti.ticker === ticker);
                if (!info) {
                    console.log(`[RadarBesstCommand] Could not find info for ticker ${ticker}`)
                    continue
                }
                message.push("\t" + tickerInfoToOneLineString(info));
            }
        }

        message.push("\n** As cotações demonstradas possuem até 1 hora de atraso.")
        await msg.reply(message.join("\n"));
    }

    private async getState(): Promise<Array<string[]>> {
        if (!this.lastLoadedState || Date.now() - this.lastLoadedTime > CACHE_TIME) {
            this.lastLoadedState = await this.stateSaver.load("./radar/besst");
            this.lastLoadedTime = Date.now();
        }
        return this.lastLoadedState;
    }

    get isV2(): boolean {
        return true;
    }
}