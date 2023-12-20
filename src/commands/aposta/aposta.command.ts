import { Client, GroupChat, Message } from "whatsapp-web.js";
import { randomIntFromInterval } from "../../utils/util";
import { bold, italic } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class ApostaCommand extends Command {
    command = '/aposta';
    alternativeCommands = []

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {


        const [totalNumbersStr, totalGamesStr] = argsArray.filter(t => !!t)

        let totalNumbers = 6
        let totalGames = 1

        if (totalNumbersStr) {
            const tn = parseInt(totalNumbersStr)
            if (!isNaN(tn)) {
                totalNumbers = tn
            }
        }

        if (totalGamesStr) {
            const tg = parseInt(totalGamesStr)
            if (!isNaN(tg)) {
                totalGames = tg
            }
        }

        const games: number[][] = [];
        for (let i = 0; i < totalGames; i++) {
            const numbers: number[] = [];
            for (let i = 0; i < totalNumbers; i++) {
                let number = randomIntFromInterval(1, 60);
                while (numbers.includes(number)) {
                    number = randomIntFromInterval(1, 60);
                }
                numbers.push(number);
            }
            numbers.sort((a, b) => a - b)
            games.push(numbers)
        }

        const replyMessages = []
        for (const g = 0; g < games.length; g++) {
            replyMessages.push(italic(bold(`[Jogo #${g + 1}]`)))
            replyMessages.push(bold(games[g].join(", ")))
            replyMessages.push("")
        }

        await msg.reply(replyMessages.join("\n"));
    }

    get isV2() {
        return true;
    }
}