import { Chat, Client, Message } from "whatsapp-web.js";
import { StateSaver } from "../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../utils/json-state-saver";
import { Command } from "./command";

import { formatToBRL, formatToNumber, parseToNumber } from "brazilian-values";
import { getStockInfo } from "../services/brapi.service";
import { calcularNovaPosicao, getPercentualDiff } from "../utils/math.utils";
import { asPercentageString } from "../utils/string.utils";
import { hasCategorySuffix } from "../utils/ticker.util";
import { extractContactId } from "../utils/whatsapp.util";


const ALLOWED_CHATS = (process.env.CARTEIRA_COMMAND_ALLOWED_CHATS || "").split(',').map(v => v.trim());

const VISUALIZAR_COMMAND = ['ver', 'visualizar'];
const CADASTRAR_EMPRESA_COMMAND = ['cadastrar', 'registrar'];
const ADICIONAR_COMPRA_COMMAND = ['compra'];
const ADICIONAR_PROVENTO_COMMAND = ['provento'];
const SETAR_DPA_PROJETIVO_COMMAND = ['dpa'];
const APORTAR_COMMAND = ['aportar'];
const REMOVER_EMPRESA_COMMAND = ['remover'];

const AVAILABLE_SUBCOMMANDS = [
    ...VISUALIZAR_COMMAND,
    ...CADASTRAR_EMPRESA_COMMAND,
    ...ADICIONAR_COMPRA_COMMAND,
    ...ADICIONAR_PROVENTO_COMMAND,
    ...SETAR_DPA_PROJETIVO_COMMAND,
    ...APORTAR_COMMAND,
    ...REMOVER_EMPRESA_COMMAND
]


const WALLET_NOT_REGISTERED_YET = 'Você ainda não possui uma carteira registrada.';

const TICKER_PLACEHOLDER = '{ticker}';
const TICKER_NOT_REGISTERED_YET = `Você não cadastrou a empresa com ticker ${TICKER_PLACEHOLDER} na sua carteira anteriormente, por favor realize o cadastro antes de usar este comando.`;

const MISSING_TICKER_PARAM = 'O Ticker é obrigatório';

interface Posicao {
    cotacao?: number,
    precoMedio: number,
    quantidade: number,
    dpaProjetivo: number,
    dpaPago: number,
    proventosRecebidos: number
}

interface CarteiraSaveState {
    [ticker: string]: Posicao
}

export class CarteiraCommand extends Command {

    private stateSaver: StateSaver<CarteiraSaveState> = new JSONStateSaver<CarteiraSaveState>();

    command = '/carteira';
    
    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [firstArg] = argsArray;
        return AVAILABLE_SUBCOMMANDS.includes(firstArg);
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (!ALLOWED_CHATS.includes(chat.id._serialized)) return;

        const [command] = argsArray;
        const args = argsArray.splice(1);
        if (VISUALIZAR_COMMAND.includes(command)) {
            await this.handleVisualizarCommand(chat, msg, ...args);
        } else if (CADASTRAR_EMPRESA_COMMAND.includes(command)) {
            await this.handleCadastrarEmpresaCommand(chat, msg, ...args);
        } else if (ADICIONAR_COMPRA_COMMAND.includes(command)) {
            await this.handleAdicionarCompraCommand(chat, msg, ...args)
        } else if (ADICIONAR_PROVENTO_COMMAND.includes(command)) {
            await this.handleProventoCommand(chat, msg, ...args);
        } else if (SETAR_DPA_PROJETIVO_COMMAND.includes(command)) {
            await this.handleSetarDPAProjetivo(chat, msg, ...args);
        } else if (APORTAR_COMMAND.includes(command)) {
            await this.handleAportarCommand(chat, msg, ...args);
        } else if (REMOVER_EMPRESA_COMMAND.includes(command)) {
            await this.handleRemoverEmpresaCommand(chat, msg, ...args);
        }
    }

    // /carteira visualizar TICKER
    private async handleVisualizarCommand(chat: Chat, msg: Message, ...argsArray: string[]) {
        const contactId = await extractContactId(msg);
        try {

            const ticker = await this.resolveTicker(...argsArray).catch(e => undefined);

            const key = this.resolveKey(contactId);
            const wallet = await this.getWallet(key);
            const msgs = [];
            if (!ticker) {
                const cotacoes = await getStockInfo(Object.keys(wallet))
                for (const [ticker, position] of Object.entries(wallet)) {
                    const { price } = cotacoes.success.find(c => c.ticker === ticker);
                    const percentDiff = getPercentualDiff(position.precoMedio, price)
                    msgs.push(`*[${ticker}] ${formatToBRL(price)}*
    _Quantidade_:      ${formatToNumber(position.quantidade)}
    _Preço Médio_:     ${formatToBRL(position.precoMedio)} *(${asPercentageString(percentDiff)})*
    _DPA Proj_.:       ${formatToBRL(position.dpaProjetivo)}
    _DPA Proj_. Pago:       ${formatToBRL(position.dpaPago)}
    _DPA Proj Restante_.: *${formatToBRL(position.dpaProjetivo - position.dpaPago)}*
    _Proventos Recebidos_: *${formatToBRL(position.proventosRecebidos)}*`)
                }

            } else {
                const hasSufix = hasCategorySuffix(ticker)
                if (hasSufix) {
                    const {c} = (await getStockInfo([ticker]))[0]
                    const position = await this.getPosition(wallet, ticker);
                    const percentDiff = getPercentualDiff(position.precoMedio, c)
                    msgs.push(`*[${ticker}] ${formatToBRL(c)}*
    _Quantidade_:      ${formatToNumber(position.quantidade)}
    _Preço Médio_:     ${formatToBRL(position.precoMedio)} *(${asPercentageString(percentDiff)})*
    _DPA Proj_.:       ${formatToBRL(position.dpaProjetivo)}
    _DPA Proj_. Pago:       ${formatToBRL(position.dpaPago)}
    _DPA Proj Restante_.:       *${formatToBRL(position.dpaProjetivo - position.dpaPago)}*
    _Proventos Recebidos_: *${formatToBRL(position.proventosRecebidos)}*`)
                } else {
                    for (const sufix of ['3', '4', '11']) {
                        const sufixedTicker = ticker + sufix;
                        const position = await this.getPosition(wallet, sufixedTicker).catch(() => undefined);
                        if (!position) continue;
                        msgs.push(`[${sufixedTicker}]
            Quantidade:      ${formatToNumber(position.quantidade)}
            Preço Médio:     ${formatToBRL(position.precoMedio)}
            DPA Proj.:       ${formatToBRL(position.dpaProjetivo)}
            DPA Proj. Pago:       ${formatToBRL(position.dpaPago)}
            DPA Proj Restante.: ${formatToBRL(position.dpaProjetivo - position.dpaPago)}
            Proventos Recebidos: ${formatToBRL(position.proventosPago)}`)
                    }
                }
            }
            await msg.reply(msgs.join('\n\n'))
        } catch (error) {
            await msg.reply(error);
        }
    }

    // /carteira cadastrar TICKER QUANTIDADE PREÇO_MÉDIO DPA_PROJETIVO DPA_PAGO PROVENTOS_RECEBIDOS
    private async handleCadastrarEmpresaCommand(chat: Chat, msg: Message, ...argsArray: string[]) {

        const contactId = await extractContactId(msg);
        try {
            let ticker = await this.resolveTicker(...argsArray);

            const key = this.resolveKey(contactId);
            let wallet = await this.getWallet(key);
            let position = await this.getPosition(wallet, ticker);

            const [_, quantidade, precoMedio, dpaProjetivo, dpaPago, proventosRecebidos] = argsArray;

            const alreadyExists = !!position;

            position = {
                quantidade: parseInt(quantidade),
                precoMedio: parseToNumber(precoMedio),
                dpaProjetivo: parseToNumber(dpaProjetivo || '0'),
                dpaPago: parseToNumber(dpaPago || '0'),
                proventosRecebidos: parseToNumber(proventosRecebidos || `0`)
            }
            wallet[ticker] = position;
            await this.stateSaver.save(key, wallet);

            await msg.reply(`${ticker.toUpperCase()} ${alreadyExists ? 'adicionado' : 'Atualizado'} com sucesso!`)
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }

    // /carteira compra TICKER QUANTIDADE VALOR_UNITARIO_COMPRA
    private async handleAdicionarCompraCommand(chat: Chat, msg: Message, ...argsArray: string[]) {
        const contactId = await extractContactId(msg);
        try {
            const [tickerStr, quantidadeStr, valorUnitarioCompraStr] = argsArray;
            let ticker = await this.resolveTicker(tickerStr);

            const quantidade = parseInt(quantidadeStr);
            const valorUnitarioCompra = parseToNumber(valorUnitarioCompraStr);

            const key = this.resolveKey(contactId);
            let wallet = await this.getWallet(key);
            const posicao = await this.getPosition(wallet, ticker); //TODO: permitir cadastrar a partir de uma compra

            const { novoPrecoMedio, novaQuantidade } = calcularNovaPosicao(posicao.precoMedio, posicao.quantidade, valorUnitarioCompra, quantidade);

            posicao.quantidade = novaQuantidade;
            posicao.precoMedio = novoPrecoMedio;

            await this.stateSaver.save(key, wallet);

            await msg.reply('Compra registrada com sucesso! Veja sua nova posição: ')
            await this.handleVisualizarCommand(chat, msg, ticker);
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }

    // /carteira provento TICKER PROVENTO_RECEBIDO_POR_ACAO
    private async handleProventoCommand(chat: Chat, msg: Message, ...argsArray: string[]) {
        const contactId = await extractContactId(msg);
        try {
            let ticker = await this.resolveTicker(...argsArray);
            const key = this.resolveKey(contactId);
            let wallet = await this.getWallet(key);
            const position = await this.getPosition(wallet, ticker);

            const [_, dpaPagoStr] = argsArray;
            const dpaPago = parseToNumber(dpaPagoStr || `0`)
            position.dpaPago += dpaPago;
            position.proventosRecebidos += dpaPago * position.quantidade

            await this.stateSaver.save(key, wallet);

            await msg.reply(`Proventos para ${ticker} atualizados com sucesso! Total já pago para o ativo: ${formatToBRL(position.dpaPago)}`)
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }

    // /carteira dpa TICKER DPA_PROJETIVO
    private async handleSetarDPAProjetivo(chat: Chat, msg: Message, ...argsArray: string[]) {
        const contactId = await extractContactId(msg);
        try {
            let ticker = await this.resolveTicker(...argsArray);
            const key = this.resolveKey(contactId);
            let wallet = await this.getWallet(key)
            const position = await this.getPosition(wallet, ticker);

            const [_, dpaProjetivo] = argsArray;
            position.dpaProjetivo += parseToNumber(dpaProjetivo || `0`)

            await this.stateSaver.save(key, wallet);

            await msg.reply(`DPA Projetivo para ${ticker} atualizados com sucesso! Novo DPA: ${formatToBRL(position.dpaProjetivo)}`)
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }

    private async handleAportarCommand(chat: Chat, msg: Message, ...argsArray: string[]) {
        const contactId = await extractContactId(msg);

        try {

            const key = this.resolveKey(contactId);
            let wallet = await this.getWallet(key);

            const [VALOR_APORTE, ORDENADO_POR, TOP_N] = argsArray;
            const valorAporte = parseToNumber(VALOR_APORTE);
            const campoOrdenacao = ORDENADO_POR || "dyAporte"; // TODO: Bloquear a operação se o campo não existir
            const topN = parseToNumber(TOP_N || `3`);

            interface ResultadoSimulacao {
                cotacao: number;
                quantidadeParaComprar: number;
                proventosEsperadosTotal: number;
                yoc: number;
                yocNovo: number;
                proventosEsperadoDesteAporte: number;
                dyAporte: number;
                posicaoFinal: number;
                novoPrecoMedio: number;
                precoMedioAntigo: number;
                totalAportado: number;
            }

            const simulacao: {
                [ticker: string]: ResultadoSimulacao
            } = {};


            const cotacoes = await getStockInfo(Object.keys(wallet));


            for (const [key, value] of Object.entries(wallet)) {

                const infoCotacao = cotacoes.success.find((cotacaoInfo) => cotacaoInfo.ticker === key);
                if (!infoCotacao) {
                    continue;
                }
                value.cotacao = infoCotacao.price;

                const quantidadeParaComprar = Math.floor(valorAporte / value.cotacao);

                const proventosPendentes = value.dpaProjetivo - value.dpaPago;

                const proventosEsperadoDesteAporte = (quantidadeParaComprar * proventosPendentes);

                const dyAporte = (proventosPendentes / value.cotacao) * 100;

                const proventosEsperadosTotal = (value.quantidade * value.dpaProjetivo) + (quantidadeParaComprar * proventosPendentes);

                const patrimonioTotal = value.quantidade * value.precoMedio;

                const totalAportado = quantidadeParaComprar * value.cotacao;

                const { novaQuantidade: posicaoFinal, novoPrecoMedio } = calcularNovaPosicao(value.precoMedio, value.quantidade, value.cotacao, quantidadeParaComprar)
                                        //                   (377,71      +    1163,5) / 16029,9
                                        //          (0,1247    * 3029    +  0,0895 * 13000 ) / 16029,9
                                       //    (((4.61 / 36.95) * 3029.9) + ((3.89 / 43.43) * 13000)) / (3029.9 + 13000)
                const yoc = (value.dpaProjetivo / value.precoMedio)  * 100;
                const yocNovo = (value.dpaProjetivo / novoPrecoMedio)  * 100;
               

                simulacao[key] = {
                    cotacao: value.cotacao,
                    quantidadeParaComprar,
                    proventosEsperadosTotal,
                    yoc,
                    yocNovo,
                    proventosEsperadoDesteAporte,
                    dyAporte,
                    posicaoFinal,
                    precoMedioAntigo: value.precoMedio,
                    novoPrecoMedio,
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

    private async handleRemoverEmpresaCommand(chat: Chat, msg: Message, ...argsArray: string[]) {
        const contactId = await extractContactId(msg);
        try {

            let ticker = await this.resolveTicker(...argsArray);

            const key = this.resolveKey(contactId);
            let wallet = await this.getWallet(key);

            const position = await this.getPosition(wallet, ticker);

            if (!position) {
                await msg.reply(`Você não possue ${ticker} cadastrado!`);
                return;
            }

            delete wallet[ticker];

            await this.stateSaver.save(key, wallet);

            await msg.reply(`Empresa ${ticker} removida com sucesso!`);
        } catch (error) {
            await msg.reply(error);
            return;
        }
    }

    private async resolveTicker(...argsArray: string[]) {
        let [ticker] = argsArray;
        if (!ticker) {
            return Promise.reject(MISSING_TICKER_PARAM);
        }
        return ticker.toUpperCase();
    }

    private async getWallet(key: string) {
        let wallet = await this.stateSaver.load(key);
        if (!wallet) {
            return Promise.reject(WALLET_NOT_REGISTERED_YET);
        }
        return wallet;
    }

    private async getPosition(wallet: CarteiraSaveState, ticker: string) {
        const position = wallet[ticker];
        if (!position) {
            return Promise.reject(TICKER_NOT_REGISTERED_YET.replace(TICKER_PLACEHOLDER, ticker));
        }
        return position;
    }

    private resolveKey(key: string) {
        return `./wallets/${key}/wallet`;
    }
}
