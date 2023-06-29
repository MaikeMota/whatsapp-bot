import { readdirSync } from "fs";
import { resolve } from "path";
import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { Command } from "../command";
import { RadarSaveState } from "./radar.savestate";
import { RADAR_PATH } from "./radar.util";


const { TEMP_FOLDER, RADAR_PREFERIDAS_UPDATE_IN_HOURS } = process.env;

const tempFolder = resolve(process.cwd(), TEMP_FOLDER || 'src/data/tmp');
const BASE_PATH = resolve(process.cwd(), tempFolder, RADAR_PATH)

const updateIntervalInHours = 1000 * 60 * 60 * parseInt(RADAR_PREFERIDAS_UPDATE_IN_HOURS || "1")
let lastUpdatedtime = new Date().getTime()

let cachedTotalUsers: number;
let cachedResult: Map<string, number>;


export class RadarPreferidasCommand extends Command {
    command: string = "preferidas";

    usageDescription = ["\t-> Mostra as Top 10 empresas mais observadas no Radar",
        "<topN>\t-> para mostrar as Top N empresas observadas no Radar, onde topN é o número desejado",
        "all\t-> para mostrar todas as empresas observadas no Radar"]

    private stateSaver: StateSaver<RadarSaveState> = new JSONStateSaver<RadarSaveState>();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        let showAll = false;
        if (argsArray[0] === "all") {
            showAll = true;
        }
        const topNToDisplay = parseInt(argsArray[0] || "10");
        const mostWanted = new Map<string, number>();
        let totalUsers = 0;

        const ttlExpired = lastUpdatedtime + updateIntervalInHours < new Date().getTime();
        const shouldUpdateResults = !cachedResult || ttlExpired

        if (shouldUpdateResults) {
            console.log(`[RadarPreferidasCommand] Updating Cached results...`)
            for (const file of readdirSync(BASE_PATH)) {
                if (!file.includes("@")) {
                    continue;
                }
                const radarSaveState = await this.stateSaver.load(resolve(BASE_PATH, file).replace(".json", ""));
                for (const ticker of radarSaveState.tickers) {
                    const total = mostWanted.get(ticker);
                    if (total) {
                        mostWanted.set(ticker, total + 1)
                    } else {
                        mostWanted.set(ticker, 1);
                    }
                }
                totalUsers++
            }
            cachedTotalUsers = totalUsers;
            cachedResult = new Map([...mostWanted.entries()].sort((a, b) => b[1] - a[1]));
        }
        const message = [`Entre os ${cachedTotalUsers} usuários registrados no *Radar*,
 as ${!showAll ? `*Top ${topNToDisplay}*` : ""} empresas preferidas são:\n`]


        let counter = 1;
        for (const [key, count] of cachedResult.entries()) {
            message.push(`${key}\t- ${count.toString().padStart(4, " ")}x`)
            if (!showAll && counter++ >= topNToDisplay) {
                break;
            }
        }
        msg.reply(message.join("\n"));
    }

    get isV2(): boolean {
        return true;
    }
}