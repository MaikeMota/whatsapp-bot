import { Chat, Client, Message } from "whatsapp-web.js";
import { WalletService } from "../../services/wallet/wallet.service";
import { resolveTicker } from "../../utils/ticker.util";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class WalletRemoveCommand extends Command {

    command: string = "remover";
    usageDescription = " TICKER \t-> Remove um ativo da carteira"

    private walletService = new WalletService();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contactId = await extractContactId(msg);
        try {

            let ticker = resolveTicker(...argsArray);

            const position = await this.walletService.removePosition(contactId, ticker);

            await msg.reply(`Empresa ${ticker} removida com sucesso!`);
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }
}