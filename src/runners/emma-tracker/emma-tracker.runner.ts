import { Client } from "whatsapp-web.js";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { bold } from '../../utils/whatsapp.util';
import { Runner } from "../interfaces/runner.interface";


export const EMMA_TRACKER_RUNNER_NAME = "EmmaTracker";

const TRACKING_CODE = process.env.EMMA_TRACKING_CODE;
const CHAT_IDS = process.env.EMMA_TRACKER_CHAT_IDS.split(',');

export class EmmaTrackerRunner implements Runner {

    runnerName: string = EMMA_TRACKER_RUNNER_NAME;
    runEveryNMinutes: number = 60;

    stateSaver = new JSONStateSaver<EmmaTrackerState>();

    async run(client: Client): Promise<void> {
        const trackerUrl = `https://api-v2.flixlog.com/tracking/${TRACKING_CODE}`;
        const response = await fetch(trackerUrl, { method: 'POST' });
        const {
            tracker: {
                details: [
                    lastStateFromApi
                ]
            },
            delivery: { delivery_date },
            status: { description }
        } = await response.json();

        const deliveryPreviewDate = new Date(delivery_date + ' 00:00:00').toLocaleDateString('pt-BR');
        const lastStateTitle = lastStateFromApi.message;
        const lastOcurrenceDate = new Date(lastStateFromApi.occurred_at);
        const lastStateDate = lastOcurrenceDate.toLocaleDateString('pt-BR') + ' ' + lastOcurrenceDate.toLocaleTimeString('pt-BR');

        let lastSaveState = await this.stateSaver.load(this.runnerName);
        if (!lastSaveState) {
            lastSaveState = {
                title: '',
                date: '',
                deliveryPreviewDate: '',
                status: ''

            }
        }
        if (lastSaveState.title !== lastStateTitle || lastSaveState.date !== lastStateDate || lastSaveState.deliveryPreviewDate !== deliveryPreviewDate || lastSaveState.status !== description) {
            lastSaveState.date = lastStateDate;
            lastSaveState.title = lastStateTitle;
            lastSaveState.deliveryPreviewDate = deliveryPreviewDate;
            lastSaveState.status = description;
            await this.stateSaver.save(this.runnerName, lastSaveState);
            for (const chatId of CHAT_IDS) {
                await client.sendMessage(chatId, `Houve uma nova atualização no tracker: 

Status: ${bold(lastSaveState.status)}
Previsão de entrega: ${bold(lastSaveState.deliveryPreviewDate)}
${bold(lastSaveState.date)} -> ${bold(lastSaveState.title)}
`)
            }
        }
    }

    shutdown(): Promise<void> {
        return Promise.resolve();
    }
}

export interface EmmaTrackerState {
    title: string;
    date: string;
    deliveryPreviewDate: string;
    status: string;
}