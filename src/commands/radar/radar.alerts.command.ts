import { formatToBRL, parseToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { hasCategorySuffix, resolveTicker } from "../../utils/ticker.util";
import { bold, extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { RadarAlertsSaveState } from "./radar.alerts.savestate";

export const RADAR_ALERTS_KEY = "./radar/radar.alerts"

export class RadarAlertsCommand extends Command {

    command: string = "alertar";
    alternativeCommands = ["alerta"];

    usageDescription = "ticker Preço\t-> Adiciona um alerta para o ticker no preço informado";

    private stateSaver: StateSaver<RadarAlertsSaveState> = new JSONStateSaver<RadarAlertsSaveState>();

    protected async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [ticker, price] = argsArray.filter(t => !!t);
        return !!ticker && !!price;
    }

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const contactId = await extractContactId(msg);
        const chatId = chat.id._serialized
        let [ticker, priceStr] = argsArray.filter(t => !!t);

        ticker = resolveTicker(ticker);

        const price = parseToNumber(priceStr);

        if (!hasCategorySuffix(ticker)) {
            await msg.reply(`O ticker informado (${ticker}) não é válido`);
            return;
        }

        if (isNaN(price)) {
            await msg.reply(`O preço de monitoramento informado não é um número válido`);
            return;
        }

        if (price < 0) {
            await msg.reply(`O preço de monitoramento informado precisa ser positivo`);
            return;
        }

        let alerts = await this.stateSaver.load(RADAR_ALERTS_KEY);
        if (!alerts) {
            alerts = {} as RadarAlertsSaveState;
        }

        let groupAlerts = alerts[chatId];
        if (!groupAlerts) {
            alerts[chatId] = {}
            groupAlerts = alerts[chatId];
        }

        let userAlerts = groupAlerts[contactId];
        if (!userAlerts) {
            groupAlerts[contactId] = [];
            userAlerts = groupAlerts[contactId];
        }

        let alert = userAlerts.find(a => a.ticker === ticker);
        let isUpdating = false;
        let isRemoving = false;

        if (!alert && price != 0) {
            alert = {
                ticker: ticker,
                price: price
            };
            userAlerts.push(alert);
        } else {
            if (price === 0) {
                userAlerts = userAlerts.filter(a => a.ticker !== ticker);
                groupAlerts[contactId] = userAlerts;
                isRemoving = true;
            } else {
                alert.price = price;
                isUpdating = true;
            }
        }

        await this.stateSaver.save(RADAR_ALERTS_KEY, alerts);

        await msg.reply(`Alerta para ${ticker} ${bold(isRemoving ? "removido" : isUpdating ? "atualizado" : "adicionado")} com sucesso! ${!isRemoving ? `[${ticker} -> ${formatToBRL(price)}]` : ""}`);
    }

}