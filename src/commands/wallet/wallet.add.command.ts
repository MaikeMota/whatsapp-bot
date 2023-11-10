import { parseToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { WalletService } from "../../services/wallet/wallet.service";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";


const MISSING_TICKER_PARAM = 'O Ticker é obrigatório';

export class WalletAddCommand extends Command {

    command: string = "cadastrar";
    alternativeCommands = ['registrar'];
    usageDescription = " TICKER <Quantidade> <Preço Médio> <DPA Projetivo> <DPA Pago> <Proventos Recebidos> \t-> Adiciona/Atualiza um ativo na sua carteira"

    private walletService = new WalletService();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contactId = await extractContactId(msg);

        try {
            let ticker = await this.resolveTicker(...argsArray);

            const [_, quantidade, precoMedio, dpaProjetivo, dpaPago, proventosRecebidos] = argsArray;

            const newPosition = {
                quantidade: parseInt(quantidade),
                precoMedio: parseToNumber(precoMedio),
                dpaProjetivo: parseToNumber(dpaProjetivo || '0'),
                dpaPago: parseToNumber(dpaPago || '0'),
                proventosRecebidos: parseToNumber(proventosRecebidos || `0`)
            }
            
            const alreadyExists = this.walletService.updatePosition(contactId, ticker, newPosition);

            await msg.reply(`${ticker.toUpperCase()} ${alreadyExists ? 'adicionado' : 'Atualizado'} com sucesso!`)
        } catch (error) {
            await msg.reply(error);
            return;
        }        
    }

    get isV2(): boolean {
        return true;
    }

    private async resolveTicker(...argsArray: string[]) {
        let [ticker] = argsArray;
        if (!ticker) {
            return undefined;
        }
        return ticker.toUpperCase();
    }
}