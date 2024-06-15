import { parseToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { WalletPosition } from "../../services/wallet/wallet.position.interface";
import { WalletService } from "../../services/wallet/wallet.service";
import { resolveTicker } from "../../utils/ticker.util";
import { bold, extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class WalletAddCommand extends Command {

    command: string = "cadastrar";
    alternativeCommands = ['registrar'];
    usageDescription = " TICKER <Quantidade> <Preço Médio> <DPA Projetivo> <DPA Pago> <Proventos Recebidos> \t-> Adiciona/Atualiza um ativo na sua carteira"

    private walletService = new WalletService();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contactId = await extractContactId(msg);

        try {
            let ticker = resolveTicker(...argsArray);

            const [_, quantidade, precoMedio, dpaProjetivo, dpaPago, proventosRecebidos] = argsArray;

            const newPosition: WalletPosition = {
                ticker,
                quantidade: parseInt(quantidade),
                precoMedio: parseToNumber(precoMedio),
                dpaProjetivo: parseToNumber(dpaProjetivo || '0'),
                dpaPago: parseToNumber(dpaPago || '0'),
                proventosRecebidos: parseToNumber(proventosRecebidos || `0`)
            }

            const alreadyExists = await this.walletService.updatePosition(contactId, newPosition);

            await msg.reply(`${ticker.toUpperCase()} ${bold(alreadyExists ? 'Atualizado' : 'Adicionado')} com sucesso!`)
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }
}