import { Client } from "whatsapp-web.js";

import { JSONStateSaver } from "../../utils/json-state-saver";

import { CounterNotifyerSaveState } from "./interfaces/counter-notifyer-save-state";
import { Runner } from "../interfaces/runner.interface";

export abstract class CounterNotifyerRunner implements Runner {

    private stateSaver = new JSONStateSaver<CounterNotifyerSaveState>();

    abstract runEveryNMinutes: number;
    abstract notifyFrequency: number;
    abstract channelsToNotify: string[];

    protected lastCountNotified: number = 0;

    private loadedPreviewState = false;

    abstract get runnerName(): string;
    abstract getCounter(): Promise<number>;
    abstract getNotifyMessage(counter: number): string;

    constructor() {
    }

    async run(client: Client): Promise<void> {
        if (!this.loadedPreviewState) {
            this.loadState();
        }
        console.info(`[${this.runnerName}][${new Date().toLocaleTimeString('pt-br')}] running`);
        const counter = await this.getCounter();
        const shouldNotify = this.shouldNotify(counter, this.notifyFrequency);
        console.info(`[${this.runnerName}][${new Date().toLocaleTimeString('pt-br')}] lastCountNotified: ${this.lastCountNotified}, counter: ${counter}, notifyFrequency: ${this.notifyFrequency}.`);
        if (shouldNotify) {
            this.lastCountNotified = counter;
            for (const channel of this.channelsToNotify) {
                client.sendMessage(channel, this.getNotifyMessage(counter));
            }
            this.saveState();
        }
    }

    async shutdown(): Promise<void> {
        await this.saveState();
    }

    protected async saveState() {
        await this.stateSaver.save<CounterNotifyerSaveState>(this.runnerName, {
            lastCountNotified: this.lastCountNotified
        });
    }

    protected async loadState() {
        const savedState = await this.stateSaver.load<CounterNotifyerSaveState>(this.runnerName);
        if (savedState) {
            this.lastCountNotified = savedState.lastCountNotified;
        }
        this.loadedPreviewState = true;
    }

    protected shouldNotify(counter: number, notifyFrequency: number) {
        const shouldNotify = counter % notifyFrequency === 0;
        return shouldNotify && counter > this.lastCountNotified;
    }
}