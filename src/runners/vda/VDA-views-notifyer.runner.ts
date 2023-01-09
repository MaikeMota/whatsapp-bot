import { getChannelStatistics } from "../../services/youtube.service";
import { CounterNotifyerRunner } from "./counter-notifyer-runner";


const { VDA_UPDATE_STATISTICS_EVERY_N_MINUTES, VDA_NOTIFY_EVERY_N_VIEWS, VDA_CHANNELS_TO_NOTIFY } = process.env;

export const updateStatisticsEveryNMinuts = parseInt(VDA_UPDATE_STATISTICS_EVERY_N_MINUTES);
export const notifyEveryNViews = parseInt(VDA_NOTIFY_EVERY_N_VIEWS);
export const channelsToNotify = VDA_CHANNELS_TO_NOTIFY.split(',').map(c => c.trim());

export class VDAViewsNotifyerRunner extends CounterNotifyerRunner {

    runEveryNMinutes: number = updateStatisticsEveryNMinuts;
    notifyFrequency: number = notifyEveryNViews;
    channelsToNotify: string[] = channelsToNotify;

    constructor() {
        super();
    }

    protected shouldNotify(counter: number, notifyFrequency: number) {
        const leftOverViews = counter % notifyFrequency;
        const roundedViews = Math.floor(counter - leftOverViews);
        const shouldNotify = roundedViews % notifyFrequency === 0;
        return shouldNotify && counter > this.lastCountNotified;
    }

    get name() { return 'VDAViewsNotifyerRunner'; }

    async getCounter(): Promise<number> {
        return getChannelStatistics().then(r => r.viewCount);
    }

    getNotifyMessage(counter: number): string {
        return `[Vida de Acionista]: Atingimos ${Math.floor(counter / 1000)}K visualizações!`;
    }
}
