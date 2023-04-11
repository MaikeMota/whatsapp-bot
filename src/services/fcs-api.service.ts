const FCS_API_KEY = process.env.FCS_API_KEY;

const DataTypeEnum = {
    STOCK: 'stock',
    CRYPTO: 'crypto'
}

const stocksCache = new Map<string, any>();
const criptoCache = new Map<string, any>();

async function retrieveData(dataType, ...tickers: string[]) {
    const searchValue = tickers.join(',')
    const apiResult = await fetch(`https://fcsapi.com/api-v3/${dataType}/latest?symbol=${searchValue}&exchange=BM%26FBovespa&access_key=${FCS_API_KEY}`).then(r => r.json());

    if (apiResult.code !== 200) {
        throw new Error("API Retornou diferente de 200.\n" + apiResult.code + "\n" + apiResult.msg);
    }
    const returnValues = [];
    for (const result of apiResult.response) {
        const { c, h, l, t, cp, s } = result;
        returnValues.push({
            ticker: s, c, h, l, t: parseInt(t), cp
        })
    }

    return returnValues;

}

export async function getStockInfo(tickers: string[]) {
    const tickersInfo = [];

    const tickersToRetrieve: string[] = [];

    for (const ticker of tickers) {
        let tickInfo = stocksCache.get(ticker);
        if (tickInfo) {
            const { t } = tickInfo;
            if (hasCacheTimeExpired(t)) {
                tickersToRetrieve.push(ticker);
            } else {
                tickersInfo.push(tickInfo)
            }
        } else {
            tickersToRetrieve.push(ticker);
        }
    }

    if (tickersToRetrieve.length) {
        try {
            const results = await retrieveData(DataTypeEnum.STOCK, ...tickersToRetrieve);
            for (const result of results) {
                stocksCache.set(result.ticker, result);
                tickersInfo.push(result)
            }
        } catch (e) {
            console.log(e);
        }
    }
    return tickersInfo.sort((a, b) => { if (a.ticker > b.ticker) return 1; if (b.ticker > a.ticker) return -1; return 0; })
}

export async function getCriptoInfo(ticker: string) {
    let tickInfo = criptoCache.get(ticker);
    if (tickInfo) {
        const { t } = tickInfo;
        if (hasCacheTimeExpired(t)) {
            tickInfo = await retrieveData(DataTypeEnum.CRYPTO, ticker)
        }
    } else {
        tickInfo = await retrieveData(DataTypeEnum.CRYPTO, ticker)
    }
    criptoCache.set(ticker, tickInfo);
    return tickInfo
}

function hasCacheTimeExpired(cachedTime) {
    return (new Date().getTime() / 1000) > (cachedTime + (60 * 60));
}

export function getSymbolFor(name) {
    switch (name) {
        case 'brl': return 'R$';
        case 'usd': return 'U$';
        default: return '$';
    }
}