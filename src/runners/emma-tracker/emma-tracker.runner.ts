import * as cheerio from 'cheerio';
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
        const trackerUrl = `https://app.flixlog.com/tracking/${TRACKING_CODE}`;
        const response = await fetch(trackerUrl).then(r => r.text());

        const $ = cheerio.load(response);
        const lastStateFromPage =  $('.MuiCardContent-root .timeline li').first();
        const deliveryPreviewDate = $('.MuiTypography-root.MuiTypography-h4.MuiTypography-colorTextPrimary').text().split(' - ')[1]?.match(/(?<date>[0-9]{2}\/[0-9]{2}\/[0-9]{4})/)?.groups?.date
        const [lastStateTitle, lastStateDate] = lastStateFromPage.text().split('\n');
        let lastSaveState = await this.stateSaver.load(this.runnerName);
        if(!lastSaveState) {
            lastSaveState = {
                title: '',
                date: '',
                lastDeliveryPreviewDate: ''

            }
        }
        if(lastSaveState.title !== lastStateTitle || lastSaveState.date !== lastStateDate || lastSaveState.lastDeliveryPreviewDate !== deliveryPreviewDate) {
            for(const chatId of CHAT_IDS){ 
                await client.sendMessage(chatId, `
                    Houve uma nova atualização no tracker: ${bold(lastStateDate)} - ${bold(lastStateTitle)}
                    Previsão de entrega: ${bold(deliveryPreviewDate)}`)
            };
            }
    }

    shutdown(): Promise<void> {
        return Promise.resolve();
    }
}

export interface EmmaTrackerState {
   title: string;
   date: string;
   lastDeliveryPreviewDate: string;
}