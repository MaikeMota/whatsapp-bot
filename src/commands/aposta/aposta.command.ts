import { Client, GroupChat, Message } from "whatsapp-web.js";
import { RandomService } from "../../services/random.service";
import { bold, italic } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class ApostaCommand extends Command {
    command = '/aposta';
    alternativeCommands = []

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {


        const [totalNumbersStr, totalGamesStr, rangeStr] = argsArray.filter(t => !!t)

        let totalNumbers = 6
        let totalGames = 1

        const [lowerBand, upperBand] = rangeStr?.split("-").map(n => parseInt(n)) || [1, 60]

        if (totalNumbersStr) {
            const tn = parseInt(totalNumbersStr)
            if (!isNaN(tn)) {
                totalNumbers = tn > 60 ? 60 : tn
            }
        }

        if (totalGamesStr) {
            const tg = parseInt(totalGamesStr)
            if (!isNaN(tg)) {
                totalGames = tg > 100 ? 100 : tg
            }
        }

        const games: number[][] = [];
        for (let i = 0; i < totalGames; i++) {
            const numbers: number[] = [];

                let generatedNumbers = await RandomService.getRandomNumbers(totalNumbers, lowerBand, upperBand);
                for (const number of generatedNumbers) {
                    if (!numbers.includes(number)) {
                        numbers.push(number)
                    }
                }
                const remainingToGenerate = totalNumbers - numbers.length
                while (remainingToGenerate > 0) {
                    let newNumber = await RandomService.getRandomNumbers(totalNumbers, lowerBand, upperBand);
                    for (const number of newNumber) {
                        if (!numbers.includes(number)) {
                            numbers.push(number)
                        }
                    }
                }
            numbers.sort((a, b) => a - b)
            games.push(numbers)
        }

        const replyMessages = []
        for (let g = 0; g < games.length; g++) {
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