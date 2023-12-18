import { formatToBRL, parseToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { WalletService } from "../../services/wallet/wallet.service";
import { resolveTicker } from "../../utils/ticker.util";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class WalletSetDPSProjectiveCommand extends Command {

    command: string = "dpa";
    usageDescription = " TICKER DPA_PROJETIVO"

    private walletService = new WalletService();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contactId = await extractContactId(msg);
        try {
            let ticker = resolveTicker(...argsArray);
            const position = await this.walletService.getPosition(contactId, ticker);

            const [_, dpsProjective] = argsArray;
            position.dpaProjetivo += parseToNumber(dpsProjective || `0`)

            await this.walletService.updatePosition(contactId, position)

            await msg.reply(`DPA Projetivo para ${ticker} atualizados com sucesso! Novo DPA: ${formatToBRL(position.dpaProjetivo)}`)
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }
}