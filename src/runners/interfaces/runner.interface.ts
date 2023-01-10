import { Client } from "whatsapp-web.js";

export interface Runner {
    runnerName: string;
    runEveryNMinutes: number;
    run(client: Client): Promise<void>
    shutdown(): Promise<void>
}