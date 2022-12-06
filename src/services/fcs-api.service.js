const FCS_API_KEY = process.env.FCS_API_KEY;

const DataTypeEnum = {
    STOCK: 'stock',
    CRYPTO: 'crypto'
}

const stocksCache = {};
const criptoCache = {}

async function retrieveData(dataType, ...tickers) {
    const searchValue = tickers.join(',')
    const apiResult = await fetch(`https://fcsapi.com/api-v3/${dataType}/latest?symbol=${searchValue}&access_key=${FCS_API_KEY}`).then(r => r.json());

    if (apiResult.code !== 200) {
        throw new Error("API Retornou diferente de 200.\n" + apiResult.code);
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

async function getStockInfo(tickers) {
    const tickersInfo = [];

    const tickersToRetrieve = [];

    for (const ticker of tickers) {
        let tickInfo = stocksCache[ticker];
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
        const results = await retrieveData(DataTypeEnum.STOCK, tickersToRetrieve);
        for (const result of results) {
            stocksCache[result.ticker] = result;
            tickersInfo.push(result)
        }
    }
    return tickersInfo.sort((a, b) => { if (a.ticker > b.ticker) return 1; if (b.ticker > a.ticker) return -1; return 0; })
}

async function getCriptoInfo(ticker) {
    let tickInfo = criptoCache[ticker];
    if (tickInfo) {
        const { t } = tickInfo;
        if (hasCacheTimeExpired(t)) {
            tickInfo = await retrieveData(DataTypeEnum.CRYPTO, ticker)
        }
    } else {
        tickInfo = await retrieveData(DataTypeEnum.CRYPTO, ticker)
    }
    criptoCache[ticker] = tickInfo;
    return tickInfo
}



function hasCacheTimeExpired(cachedTime) {
    return (new Date().getTime() / 1000) > (cachedTime + (60 * 60));
}


function getSymbolFor(name) {
    switch (name) {
        case 'brl': return 'R$';
        case 'usd': return 'U$';
        default: return '$';
    }
}

module.exports = {
    getCriptoInfo,
    getStockInfo,
    getSymbolFor
}
