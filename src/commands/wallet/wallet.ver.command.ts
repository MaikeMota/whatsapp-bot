import { formatToBRL, formatToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { getStockInfo } from "../../services/fcs-api.service";
import { StockInfo } from "../../services/stock-info.interface";
import { Wallet } from "../../services/wallet/wallet.interface";
import { WalletPosition } from "../../services/wallet/wallet.position.interface";
import { WalletService } from "../../services/wallet/wallet.service";
import { getPercentualDiff } from "../../utils/math.utils";
import { asPercentageString } from "../../utils/string.utils";
import { hasCategorySuffix } from "../../utils/ticker.util";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class WalletVerCommand extends Command {

    command: string = "ver";
    usageDescription = "\t-> Mostra as empresas cadastradas na sua carteira."

    private walletService = new WalletService();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contactId = await extractContactId(msg);
        try {

            const ticker = await this.resolveTicker(...argsArray)

            const wallet = await this.walletService.getWallet(contactId);
            const msgs = [];

            if (!ticker) {
                const walletMessages = await this.viewAllWallet(wallet);
                msgs.push(...walletMessages)

            } else {
                const walletMessages = await this.viewOneticker(ticker, contactId);
                msgs.push(...walletMessages)
            }
            await msg.reply(msgs.join('\n\n'))
        } catch (error) {
            await msg.reply(error);
        }
    }

    private async viewOneticker(ticker: string, contactId: string): Promise<string[]> {
        const msgs = [];
        const hasSufix = hasCategorySuffix(ticker);
        if (hasSufix) {

            const position = await this.walletService.getPosition(contactId, ticker);
            const tickerResponse = await getStockInfo([ticker]);
            const tickerInfo = tickerResponse.success[0];

            msgs.push(this.formatMessage(tickerInfo, position));
        } else {

            for (const sufix of ['3', '4', '11']) {
                const sufixedTicker = ticker + sufix;
                const position = await this.walletService.getPosition(contactId, sufixedTicker).catch(e => undefined);
                if (!position) continue;

                const tickerResponse = await getStockInfo([ticker]);
                const tickerInfo = tickerResponse.success[0];

                msgs.push(this.formatMessage(tickerInfo, position));
            }
        }

        return msgs;
    }

    private formatMessage(tickerInfo: StockInfo, position: WalletPosition): any {
        const percentDiff = getPercentualDiff(position.precoMedio, tickerInfo.price);
        return `*[${tickerInfo.ticker}] ${formatToBRL(position.precoMedio)}*
    _Quantidade_:            ${formatToNumber(position.quantidade)}
    _Preço Médio_:          *${formatToBRL(position.precoMedio)} *(${asPercentageString(percentDiff)})*
    _DPA Proj_.:            *${formatToBRL(position.dpaProjetivo)}*
    _DPA Proj_. Pago:       *${formatToBRL(position.dpaPago)}*
    _DPA Proj Restante_.:   *${formatToBRL(position.dpaProjetivo - position.dpaPago)}*
    _Proventos Recebidos_:  *${formatToBRL(position.proventosRecebidos)}*`;
    }

    private async viewAllWallet(wallet: Wallet): Promise<string[]> {
        const msgs = [];
        const cotacoesResult = await getStockInfo(Object.keys(wallet));

        const cotacoesMap = cotacoesResult.success.reduce((acc, cotacao) => {
            acc.set(cotacao.ticker, cotacao);
            return acc;
        }, new Map<string, StockInfo>());

        for (const [ticker, position] of Object.entries(wallet)) {

            const { price } = cotacoesMap.get(ticker);

            const percentDiff = getPercentualDiff(position.precoMedio, price);

            msgs.push(`*[${ticker}] ${formatToBRL(price)}*
    _Quantidade_:      ${formatToNumber(position.quantidade)}
    _Preço Médio_:     ${formatToBRL(position.precoMedio)} *(${asPercentageString(percentDiff)})*
    _DPA Proj_.:       ${formatToBRL(position.dpaProjetivo)}
    _DPA Proj_. Pago:       ${formatToBRL(position.dpaPago)}
    _DPA Proj Restante_.: *${formatToBRL(position.dpaProjetivo - position.dpaPago)}*
    _Proventos Recebidos_: *${formatToBRL(position.proventosRecebidos)}*`);
        }

        return msgs;
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