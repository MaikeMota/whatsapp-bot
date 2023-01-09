import { getChannelStatistics } from "../../services/youtube.service";
import { CounterNotifyerRunner } from "./counter-notifyer-runner";


const { VDA_UPDATE_STATISTICS_EVERY_N_MINUTES, VDA_NOTIFY_EVERY_N_SUBSCRIBERS,  VDA_CHANNELS_TO_NOTIFY } = process.env;

const updateStatisticsEveryNMinuts = parseInt(VDA_UPDATE_STATISTICS_EVERY_N_MINUTES);
const notifyEveryNSubscribers = parseInt(VDA_NOTIFY_EVERY_N_SUBSCRIBERS);
const channelsToNotify = VDA_CHANNELS_TO_NOTIFY.split(',').map(c => c.trim());



export class VDASubscribersNotifyerRunner extends CounterNotifyerRunner {

    runEveryNMinutes: number = updateStatisticsEveryNMinuts;
    notifyFrequency: number = notifyEveryNSubscribers;
    channelsToNotify: string[] = channelsToNotify;

    constructor() {
        super();
    }

    get name() { return 'VDASubscribersNotifyerRunner'; }

    async getCounter(): Promise<number> {
        return getChannelStatistics().then(r => r.subscriberCount);
    }
    
    getNotifyMessage(counter: number): string {
        return `[Vida de Acionista]: Atingimos ${(counter / 1000).toString().replaceAll('.', ',')}K inscritos!`;
    }


}
