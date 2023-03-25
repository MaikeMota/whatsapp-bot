export function calcularNovaPosicao(
    precoMedioAtual: number,
    quantidadeAtual: number,
    valorUnitarioNovaCompra: number,
    quantidadeNovaCompra: number) {

    const novaQuantidade = quantidadeAtual + quantidadeNovaCompra;
    const novoPrecoMedio = ((precoMedioAtual * quantidadeAtual) + (valorUnitarioNovaCompra * quantidadeNovaCompra)) / (novaQuantidade);

    return {
        novaQuantidade,
        novoPrecoMedio
    }
}

export function getPercentualDiff(initialValue: number, currentValue: number) {
    return ((currentValue - initialValue) / initialValue) * 100;
}

export function roundNumberTo(number: number, roundAt: number) {
    const theRest = number % roundAt;
    const roundedViews = Math.floor(number - theRest);
    return roundedViews;
}


