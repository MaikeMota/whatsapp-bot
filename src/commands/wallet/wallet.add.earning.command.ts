import { formatToBRL, parseToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { WalletService } from "../../services/wallet/wallet.service";
import { resolveTicker } from "../../utils/ticker.util";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class WalletAddEarningCommand extends Command {

    command: string = "provento";
    usageDescription = " TICKER PROVENTO_RECEBIDO_POR_ACAO"

    private walletService = new WalletService();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contactId = await extractContactId(msg);
        try {
            let ticker = resolveTicker(...argsArray);
            const position = await this.walletService.getPosition(contactId, ticker);

            const [_, dpaPagoStr] = argsArray;
            const dpsPaid = parseToNumber(dpaPagoStr || `0`)
            position.dpaPago += dpsPaid;
            position.proventosRecebidos += dpsPaid * position.quantidade

            await this.walletService.updatePosition(contactId, position)

            await msg.reply(`Proventos para ${ticker} atualizados com sucesso! Total já pago para o ativo: ${formatToBRL(position.dpaPago)}`)
        } catch (error) {
            await msg.reply(error);
        }
    }
}