import { Client, GroupChat, Message } from "whatsapp-web.js";
import { randomIntFromInterval } from "../../utils/util";
import { bold } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class ApostaCommand extends Command {
    command = '/aposta';
    alternativeCommands = []

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {
        const numbers: number[] = [];
        for (let i = 0; i < 6; i++) {

            let number = randomIntFromInterval(1, 60);
            while (numbers.includes(number)) {
                number = randomIntFromInterval(1, 60);
            }
            numbers.push(number);
        }

        numbers.sort((a, b) => a - b)
        await msg.reply(bold(numbers.join(", ")));
    }

    get isV2() {
        return true;
    }
}