import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { hasCategorySuffix } from "../../utils/ticker.util";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { RadarSaveState } from "./radar.savestate";
import { RadarUtil } from "./radar.util";

export class RadarAdicionarCommand extends Command {
    command: string = "adicionar";
    alternativeCommands = ["add"];

    usageDescription = "<ticker>\t-> Adiciona um ticker ao radar";

    private stateSaver: StateSaver<RadarSaveState> = new JSONStateSaver<RadarSaveState>();

    protected async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [ticker] = argsArray.filter(t => !!t);
        return !!ticker && hasCategorySuffix(ticker.trim());
    }

    async handle(client: Client, chat: Chat, msg: Message, ...tickers: string[]): Promise<void> {
        const contactId = await extractContactId(msg);
        const key = RadarUtil.getStateKey(contactId);
        let currentState = await this.stateSaver.load(key);
        if (!currentState) {
            currentState = {
                tickers: []
            };
        }

        const withoutSuffix = []
        const added = []
        const alreadyExists = [];
        for (const ticker of tickers.filter(t => !!t).map(t => t.toUpperCase())){

            if (!hasCategorySuffix(ticker)) {
                withoutSuffix.push(ticker);
                continue;
            }
            const alreadyAdded = currentState.tickers.includes(ticker);
            if (alreadyAdded) {
                alreadyExists.push(ticker);
                continue;
            }
            currentState.tickers.push(ticker);
            added.push(ticker);
        }

        this.stateSaver.save(key, currentState);

        const message = [];

        if(added.length == 1) {
            message.push(`\nO ticker *${added[0]}* foi adicionado ao seu radar.`);
        }else if(added.length > 1) {
            message.push(`\nOs tickers *${added.join(", ")}* foram adicionados ao seu radar.`);
        }

        if(alreadyExists.length > 0) {
            message.push(`\nOs tickers *${alreadyExists.join(", ")}* já estavam no seu radar.`);
        }

        if(withoutSuffix.length > 0) {
            message.push(`\nOs tickers *${withoutSuffix.join(", ")}* não são válidos.`);
        }

        await msg.reply(message.join("\n"));


    }

    get isV2(): boolean {
        return true;
    }

}