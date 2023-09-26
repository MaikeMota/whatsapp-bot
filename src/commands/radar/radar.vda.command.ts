import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { Command } from "../command";


const CACHE_TIME = 1000 * 60 * parseInt((process.env.RADAR_VDA_COMMAND_INTERVAL_IN_MINUTES || `10`))

export class RadarVDACommand extends Command {
    command: string = "vda";

    usageDescription = "\t-> Mostra a cotações das empresas da carteira do Canal Vida de Acionista"

    private stateSaver: StateSaver<Array<string>> = new JSONStateSaver<Array<string>>();

    private lastLoadedState: Array<string>;
    private lastLoadedTime: number = 0;



    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        msg.reply("Comando desabilitado.")
    }

    private async getState(): Promise<Array<string>> {
        if (!this.lastLoadedState || Date.now() - this.lastLoadedTime > CACHE_TIME) {
            this.lastLoadedState = await this.stateSaver.load("./radar/vda");
            this.lastLoadedTime = Date.now();
        }
        return this.lastLoadedState;
    }

    get isV2(): boolean {
        return true;
    }
}