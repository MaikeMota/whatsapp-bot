import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { hasCategorySuffix } from "../../utils/ticker.util";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { RadarSaveState } from "./radar.savestate";
import { RadarUtil } from "./radar.util";

export class RadarRemoverCommand extends Command {
    command: string = "remover";
    alternativeCommands = ["rm"];

    usageDescription = "<ticker>\t-> Remove um ticker do radar";

    private stateSaver: StateSaver<RadarSaveState> = new JSONStateSaver<RadarSaveState>();

    protected async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [ticker] = argsArray;
        return !!ticker && hasCategorySuffix(ticker);
    }

    async handle(client: Client, chat: Chat, msg: Message, ...tickers: string[]): Promise<void> {
        if (["554399631160-1592936664@g.us", "120363159731656783@g.us"].includes(chat.id._serialized)) {
            msg.reply(`Este comando está disponível apenas para o grupo BOT VDA.
    *Acesse o link abaixo para entrar no grupo:*
        https://chat.whatsapp.com/FmBQj0c6hrt8Ko8JdN24PL`)
            return;
        }

        const contactId = await extractContactId(msg);
        const key = RadarUtil.getStateKey(contactId);
        let currentState = await this.stateSaver.load(key);

        if (!currentState) {
            await msg.reply("Você não possui nenhum ticker registrado no seu radar.");
            return
        }

        const removed = [];
        const notFound = [];
        const withoutSuffix = []
        for (const ticker of tickers.map(t => t.toUpperCase())) {
            if(!hasCategorySuffix(ticker)) {
                withoutSuffix.push(ticker);
                continue;
            }
            const alreadyAdded = currentState.tickers.includes(ticker);
            if (!alreadyAdded) {
                notFound.push(ticker);
                continue;
            }
            currentState.tickers = currentState.tickers.filter(t => t !== ticker);
            removed.push(ticker)
        }
        this.stateSaver.save(key, currentState);

        const message = []

        if (removed.length == 1) {
            message.push(`\nO ticker *${removed[0]}* foi removido do seu radar.`);
        } else if (removed.length > 1) {
            message.push(`\nOs tickers *${removed.join(", ")}* foram removidos do seu radar.`);
        }

        if (notFound.length == 1) {
            message.push(`\nO ticker *${notFound[0]}* não faz parte do seu radar.`);
        } else if (notFound.length > 1) {
            message.push(`\nOs tickers *${notFound.join(", ")}* não fazem parte do seu radar.`);
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