import { formatToBRL, parseToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { getStockInfo } from "../../services/brapi.service";
import { WalletService } from "../../services/wallet/wallet.service";
import { calculateNewPosition } from "../../utils/math.utils";
import { bold, extractContactId, italic, tabs } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { InvestimentSimulationResult } from "./investiment.simulation.result.interface";

export class WalletSimulateInvestimentCommand extends Command {

    command: string = "aportar";
    usageDescription = " TICKER <Valor Aporte> <Ordenar Por> <TOP N> \t-> Simula um aporte na carteira e indica os ativos mais interessantes para aportar"

    private walletService = new WalletService();

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contactId = await extractContactId(msg);

        try {

            let wallet = await this.walletService.getWallet(contactId);

            const [VALOR_APORTE, ORDENADO_POR, TOP_N] = argsArray;
            const valorAporte = parseToNumber(VALOR_APORTE);
            const campoOrdenacao = ORDENADO_POR || "dyAporte"; // TODO: Bloquear a operação se o campo não existir

            const topN = parseToNumber(TOP_N || `3`);

            const simulacao: {
                [ticker: string]: InvestimentSimulationResult
            } = {};


            const cotacoes = await getStockInfo(Object.keys(wallet));


            for (const [ticker, position] of Object.entries(wallet)) {

                const infoCotacao = cotacoes.success.find((cotacaoInfo) => cotacaoInfo.ticker === ticker);
                if (!infoCotacao) {
                    continue;
                }
                const currentPrice = infoCotacao.price;

                const quantidadeParaComprar = Math.floor(valorAporte / currentPrice);

                const proventosPendentes = position.dpaProjetivo - position.dpaPago;

                const proventosEsperadoDesteAporte = (quantidadeParaComprar * proventosPendentes);

                const dyAporte = (proventosPendentes / currentPrice) * 100;

                const proventosEsperadosTotal = (position.quantidade * position.dpaProjetivo) + (quantidadeParaComprar * proventosPendentes);

                const patrimonioTotal = position.quantidade * position.precoMedio;

                const totalAportado = quantidadeParaComprar * currentPrice;

                const { quantidade: newQuantity, precoMedio: newAveragePrice } = calculateNewPosition(position.precoMedio, position.quantidade, currentPrice, quantidadeParaComprar)
                                        //                   (377,71      +    1163,5) / 16029,9
                                        //          (0,1247    * 3029    +  0,0895 * 13000 ) / 16029,9
                                       //    (((4.61 / 36.95) * 3029.9) + ((3.89 / 43.43) * 13000)) / (3029.9 + 13000)
                const yoc = (position.dpaProjetivo / position.precoMedio)  * 100;
                const yocNovo = (position.dpaProjetivo / newAveragePrice)  * 100;
               

                simulacao[ticker] = {
                    cotacao: currentPrice,
                    quantidadeParaComprar,
                    proventosEsperadosTotal,
                    yoc,
                    yocNovo,
                    proventosEsperadoDesteAporte,
                    dyAporte,
                    posicaoFinal: newQuantity,
                    precoMedioAntigo: position.precoMedio,
                    novoPrecoMedio: newAveragePrice,
                    totalAportado
                }
            }

            let entries = Object.entries(simulacao)
            const mappedValues = entries.flatMap(([key, value]) => { return { ativo: key, ...value } })
            mappedValues.sort((valueA, valueB) => { return valueB[campoOrdenacao] - valueA[campoOrdenacao] });
            const msgs = mappedValues.filter((i, index) => index < topN)
                .map(({ cotacao, ativo, totalAportado, posicaoFinal, novoPrecoMedio, precoMedioAntigo, quantidadeParaComprar, proventosEsperadoDesteAporte, dyAporte, proventosEsperadosTotal, yoc, yocNovo }) => {
                    const novoPmPercent = ((novoPrecoMedio - precoMedioAntigo) / precoMedioAntigo) * 100;
                    const yocNovoPercent = ((yocNovo - yoc  ) / yoc) * 100;

                    return `${bold(`[${ativo}]`)}
    ${italic("Cotação")} ${tabs(3)} > ${formatToBRL(cotacao)} 
    ${italic("Capacidade Compra")} ${tabs(1)} > ${quantidadeParaComprar.toString().padStart(4, ' ')}
    ${italic("Total Aportado")} ${tabs(2)} > ${formatToBRL(totalAportado)} (${((totalAportado / valorAporte) * 100).toLocaleString('pt-BR')}%)
    ${italic("Posição final")} ${tabs(2)} > ${posicaoFinal.toString().padStart(4, ' ')}
    ${italic("PM Atual")} ${tabs(3)} > ${formatToBRL(precoMedioAntigo)}
    ${italic("Novo PM")} ${tabs(3)} > ${formatToBRL(novoPrecoMedio)} (${novoPmPercent > 0 ? '+' : ''}${novoPmPercent.toFixed(2)}%)
    ${italic("Proventos Aporte")} ${tabs(1)} > ${formatToBRL(proventosEsperadoDesteAporte)}
    ${italic("Potencial DY Aporte")} ${tabs(1)} > ${dyAporte.toLocaleString('pt-BR').padStart(5, ' ')}%
    ${italic("Proventos Totais")} ${tabs(2)} > ${formatToBRL(proventosEsperadosTotal)}
    ${italic("DY final")} ${tabs(3)} > ${yoc.toLocaleString('pt-BR').padStart(5, ' ')}% => ${yocNovo.toLocaleString('pt-BR').padStart(5, ' ')}% (${yocNovoPercent > 0 ? '+' : ''}${yocNovoPercent.toFixed(2)}%)`
                })
            await msg.reply(`= TOP ${topN} para ${campoOrdenacao} =`)
            await chat.sendMessage(msgs.join('\n\n'));
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }
}