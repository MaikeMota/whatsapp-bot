import { formatToBRL, parseToNumber } from "brazilian-values";
import { Chat, Client, Message } from "whatsapp-web.js";
import { getStockInfo } from "../../services/fcs-api.service";
import { WalletService } from "../../services/wallet/wallet.service";
import { calculateNewPosition } from "../../utils/math.utils";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";
import { InvestimentSimulationResult } from "./investiment.simulation.result.interface";

export class WalletSimulateInvestimentCommand extends Command {

    command: string = "aportar";
    alternativeCommands = ['registrar'];
    usageDescription = " TICKER <Quantidade> <Preço Médio> <DPA Projetivo> <DPA Pago> <Proventos Recebidos> \t-> Adiciona/Atualiza um ativo na sua carteira"

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

                const proventosPendentes = position.dpsProjective - position.dpsPaid;

                const proventosEsperadoDesteAporte = (quantidadeParaComprar * proventosPendentes);

                const dyAporte = (proventosPendentes / currentPrice) * 100;

                const proventosEsperadosTotal = (position.quantity * position.dpsProjective) + (quantidadeParaComprar * proventosPendentes);

                const patrimonioTotal = position.quantity * position.averagePrice;

                const totalAportado = quantidadeParaComprar * currentPrice;

                const { quantity: newQuantity, averagePrice: newAveragePrice } = calculateNewPosition(position.averagePrice, position.quantity, currentPrice, quantidadeParaComprar)
                                        //                   (377,71      +    1163,5) / 16029,9
                                        //          (0,1247    * 3029    +  0,0895 * 13000 ) / 16029,9
                                       //    (((4.61 / 36.95) * 3029.9) + ((3.89 / 43.43) * 13000)) / (3029.9 + 13000)
                const yoc = (position.dpsProjective / position.averagePrice)  * 100;
                const yocNovo = (position.dpsProjective / newAveragePrice)  * 100;
               

                simulacao[ticker] = {
                    cotacao: currentPrice,
                    quantidadeParaComprar,
                    proventosEsperadosTotal,
                    yoc,
                    yocNovo,
                    proventosEsperadoDesteAporte,
                    dyAporte,
                    posicaoFinal: newQuantity,
                    precoMedioAntigo: position.averagePrice,
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
                    return `[${ativo} - ${formatToBRL(cotacao)}] 
    Capacidade Compra > ${quantidadeParaComprar.toString().padStart(4, ' ')}
    Total Aportado    > ${formatToBRL(totalAportado)} (${((totalAportado / valorAporte) * 100).toLocaleString('pt-BR')}%)
    Posição final     > ${posicaoFinal.toString().padStart(4, ' ')}
    PM Atual          > ${formatToBRL(precoMedioAntigo)}
    Novo PM           > ${formatToBRL(novoPrecoMedio)} (${novoPmPercent > 0 ? '+' : ''}${novoPmPercent.toFixed(2)}%)
    Proventos Aporte  > ${formatToBRL(proventosEsperadoDesteAporte)}
    DY Aporte         > ${dyAporte.toLocaleString('pt-BR').padStart(5, ' ')}%
    Proventos Totais  > ${formatToBRL(proventosEsperadosTotal)}
    DY final          > ${yoc.toLocaleString('pt-BR').padStart(5, ' ')}% -> ${yocNovo.toLocaleString('pt-BR').padStart(5, ' ')}% (${yocNovoPercent > 0 ? '+' : ''}${yocNovoPercent.toFixed(2)}%)`
                })
            await msg.reply(`= TOP ${topN} para ${campoOrdenacao} =`)
            await chat.sendMessage(msgs.join('\n\n'));
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }
}