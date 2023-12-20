import { Client, GroupChat, Message } from "whatsapp-web.js";
import { randomIntFromInterval } from "../../utils/util";
import { Command } from "../command";

export class ApostaCommand extends Command {
    command = '/aposta';
    alternativeCommands = []

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {
        const numbers = [];
        for (let i = 0; i < 6; i++) {
            const number = randomIntFromInterval(1, 60);
            numbers.push(number);
        }
        await chat.sendMessage(numbers.join(","));
    }

    get isV2() {
        return true;
    }
}