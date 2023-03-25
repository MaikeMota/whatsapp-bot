import { getChannelStatistics } from "../../services/youtube.service";
import { roundNumberTo } from "../../utils/math.utils";
import { CounterNotifyerRunner } from "./counter-notifyer-runner";

const { VDA_UPDATE_STATISTICS_EVERY_N_MINUTES, VDA_NOTIFY_EVERY_N_VIEWS, VDA_CHANNELS_TO_NOTIFY } = process.env;

const updateStatisticsEveryNMinuts = parseInt(VDA_UPDATE_STATISTICS_EVERY_N_MINUTES);
const notifyEveryNViews = parseInt(VDA_NOTIFY_EVERY_N_VIEWS);
const channelsToNotify = VDA_CHANNELS_TO_NOTIFY.split(',').map(c => c.trim());

export class VDAViewsNotifyerRunner extends CounterNotifyerRunner {

    runEveryNMinutes: number = updateStatisticsEveryNMinuts;
    notifyFrequency: number = notifyEveryNViews;
    channelsToNotify: string[] = channelsToNotify;

    constructor() {
        super();
    }

    protected shouldNotify(counter: number, notifyFrequency: number) {
        const actualViews = roundNumberTo(counter, notifyFrequency);
        const lastViews = roundNumberTo(this.lastCountNotified, notifyFrequency)
        return actualViews > lastViews;
    }

    get runnerName() { return 'VDAViewsNotifyerRunner'; }

    async getCounter(): Promise<number> {
        return getChannelStatistics().then(r => r.viewCount);
    }

    getNotifyMessage(counter: number): string {
        return `[Vida de Acionista]: Atingimos ${Math.floor(counter / 1000)}K visualizações!`;
    }
}
