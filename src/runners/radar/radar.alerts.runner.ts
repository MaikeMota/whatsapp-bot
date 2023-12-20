import { formatToBRL } from "brazilian-values";
import { Client } from "whatsapp-web.js";
import { RADAR_ALERTS_KEY } from "../../commands/radar/radar.alerts.command";
import { RadarAlertsSaveState } from "../../commands/radar/radar.alerts.savestate";
import { getStockInfo } from "../../services/fcs-api.service";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { bold } from "../../utils/whatsapp.util";
import { Runner } from "../interfaces/runner.interface";


export const RADAR_ALERTS_RUNNER_NAME = "RadarAlertsRunner";


export class RadarAlertsRunner implements Runner {
    runnerName: string = RADAR_ALERTS_RUNNER_NAME;
    runEveryNMinutes: number = 30;

    stateSaver = new JSONStateSaver<RadarAlertsSaveState>();

    async run(client: Client): Promise<void> {
        const alerts = await this.stateSaver.load(RADAR_ALERTS_KEY);


        const alertsEntries = Object.entries(alerts);

        const tickersToRequest = new Set<string>();

        for (const [_, groupAlerts] of alertsEntries) {
            for (const [_, userAlerts] of Object.entries(groupAlerts)) {
                for (const alert of userAlerts) {
                    tickersToRequest.add(alert.ticker);
                }
            }
        }

        const tickerPricesRequest = await getStockInfo(Array.from(tickersToRequest));

        for (const stockInfo of tickerPricesRequest.success) {
            for (const [groupId, groupAlerts] of alertsEntries) {
                for (const [contactId, userAlerts] of Object.entries(groupAlerts)){
                    for (const alert of userAlerts) {
                        if (alert.ticker === stockInfo.ticker && stockInfo.price <= alert.price) {
                            const chat = await client.getChatById(groupId);
                            const contact = await client.getContactById(contactId);
                            await chat.sendMessage(`@${contact.id.user} o preço de ${bold(stockInfo.ticker)} atingiu 
${bold(formatToBRL(stockInfo.price))}, está abaixo do seu preço estipulado de ${bold(formatToBRL(alert.price))}!`, {
    mentions: [contact]
});
                        }
                    }
                }
            }
        }

    }

    shutdown(): Promise<void> {
        return Promise.resolve();
    }
}