export interface InvestimentSimulationResult {
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