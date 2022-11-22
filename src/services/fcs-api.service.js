const FCS_API_KEY = process.env.FCS_API_KEY;

const DataTypeEnum = {
    STOCK: 'stock',
    CRYPTO: 'crypto'
}

const stocksCache = {};
const criptoCache = {}

async function retrieveData(ticker, dataType) {
    const result = await fetch(`https://fcsapi.com/api-v3/${dataType}/latest?symbol=${ticker}&access_key=${FCS_API_KEY}`).then(r => r.json());

    if (result.code === 200) {
        const { c, h, l, t, cp } = result.response[0];
        return {
            c, h, l, t: parseInt(t), cp
        };
    }
}

async function getStockInfo(ticker) {
    let tickInfo = stocksCache[ticker];
    if (tickInfo) {
        const { t } = tickInfo;
        if (hasCacheTimeExpired(t)) {
            tickInfo = await retrieveData(ticker, DataTypeEnum.STOCK);
        }
    } else {
        tickInfo = await retrieveData(ticker, DataTypeEnum.STOCK);
    }

    stocksCache[ticker] = tickInfo;
    return tickInfo
}

async function getCriptoInfo(ticker) {
    let tickInfo = criptoCache[ticker];
    if (tickInfo) {
        const { t } = tickInfo;
        if (hasCacheTimeExpired(t)) {
            tickInfo = await retrieveData(ticker, DataTypeEnum.CRYPTO)
        }
    } else {
        tickInfo = await retrieveData(ticker, DataTypeEnum.CRYPTO)
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
