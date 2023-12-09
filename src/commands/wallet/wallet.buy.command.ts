import { parseToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { WalletService } from "../../services/wallet/wallet.service";
import { calculateNewPosition } from "../../utils/math.utils";
import { resolveTicker } from "../../utils/ticker.util";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { WalletVerCommand } from "./wallet.ver.command";

export class WalletBuyCommand extends Command {

    command: string = "compra";
    usageDescription = " TICKER QUANTIDADE VALOR_UNITARIO_COMPRA"

    private walletService = new WalletService();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contactId = await extractContactId(msg);
        try {
            const [tickerStr, quantidadeStr, valorUnitarioCompraStr] = argsArray;
            let ticker = resolveTicker(tickerStr);

            const quantidade = parseInt(quantidadeStr);
            const valorUnitarioCompra = parseToNumber(valorUnitarioCompraStr);

            let previousPosition = await this.walletService.getPosition(contactId, ticker);

            if(!previousPosition) { 
                previousPosition = {
                    ticker,
                    quantidade: 0,
                    precoMedio: 0,
                    dpaProjetivo: 0,
                    dpaPago: 0,
                    proventosRecebidos: 0
                }
            } 

            const { precoMedio, quantidade: newQuantity } = calculateNewPosition(previousPosition.precoMedio, previousPosition.quantidade, valorUnitarioCompra, quantidade);

            previousPosition.precoMedio = precoMedio;
            previousPosition.quantidade = newQuantity;

            await this.walletService.updatePosition(contactId, previousPosition);

            await msg.reply('Compra registrada com sucesso! Veja sua nova posição: ')
            return  new WalletVerCommand().handle(client, chat, msg, previousPosition.ticker)
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }
}