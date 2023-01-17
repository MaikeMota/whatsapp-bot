const API_URL = "https://www3.bcb.gov.br/novoselic/rest/taxaSelicApurada/pub/search?parametrosOrdenacao=%5B%5D&page=1&pageSize=20"

const HEADERS = {
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json;charset=UTF-8",
} as const

export async function getTaxaSelic() {

    const dataFimConsulta = new Date()
    const dataFimConsultaStr = dataFimConsulta.toLocaleDateString('pt-br');
    dataFimConsulta.setDate(dataFimConsulta.getDate() - 7);
    const dataInicioConsultaStr = dataFimConsulta.toLocaleDateString('pt-br');


    const body = {
        dataInicial: dataInicioConsultaStr,
        dataFinal: dataFimConsultaStr
    } as const;

    const { registros } = await fetch(API_URL, {
        "headers": HEADERS,
        "body": JSON.stringify(body),
        "method": "POST"
    }).then(async r => await r.json() as SelicAPIResult);

    for (const registro of registros) {
        if (registro.taxaAnual !== 0) {
            return registro.taxaAnual
        }
    }
}

interface SelicData {
    dataCotacao: string,
    fatorDiario: number
    media: number
    mediana: number
    moda: number
    desvioPadrao: number
    indiceCurtose: number
    financeiro: number
    qtdOperacoes: number
    taxaAnual: number
}
interface SelicAPIResult {
    totalItems: number,
    registros: SelicData[],
    observacoes: string[],
    dataAtual: string
}