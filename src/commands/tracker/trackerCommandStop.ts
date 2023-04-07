import { DateTime } from 'luxon';
import { Chat, Client, Message } from "whatsapp-web.js";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { resolveKey, stateSaver } from "./tracker";

export class TrackerCommandStop extends Command {
    description: string;
    command = "stop";
    alternativeCommands = ["parar", "finalizar"];

    usageDescription: string = "<chave> <descrição?> - Finaliza o tracking para a chave informada";

    protected async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [key] = argsArray;
        return !!key;
    }

    async handle(_: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const [key] = argsArray;
        const stateKey = resolveKey(await extractContactId(msg), key);
        const status = await stateSaver.load(stateKey);
        if (!status) {
            await msg.reply(`Não existe um tracking para a chave '${key}'`);
            return;
        }
        const startDate = DateTime.fromMillis(status.startDate);

        const obj = DateTime.fromMillis(Date.now())
            .diff(startDate, ["years", "months", "days", "hours", 'minutes'])
            .toObject();

        const { years, months, days, hours, minutes } = obj;

        let timeElapsed = `${years ? years + ' Anos, ' : ''}${months ? months + ' Meses, ' : ''}${days} Dias, ${hours} Horas, ${minutes.toFixed(0)} Minutos!`;

        await msg.reply(`Finalizando tracking para a chave '${key}'.

${status.description ? status.description + '\n' : ''}
Tempo Decorrido: ${timeElapsed} `);

        await stateSaver.remove(stateKey);
    }

    get isV2(): boolean {
        return true
    }
}
