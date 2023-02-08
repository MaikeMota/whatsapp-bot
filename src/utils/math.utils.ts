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
