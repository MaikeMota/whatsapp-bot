import { Client } from "whatsapp-web.js";

export interface Runner {
    name: string;
    runEveryNMinutes: number;
    run(client: Client): Promise<void>
    shutdown(): Promise<void>
}