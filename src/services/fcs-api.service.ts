import { FinancialAPIRequestResult } from "./financial-api-request-result.interface";
import { CriptoInfo, StockInfo } from "./stock-info.interface";

const DataTypeEnum = {
    STOCK: 'stock',
    CRYPTO: 'crypto'
} as const

type DataType = (typeof DataTypeEnum)[keyof typeof DataTypeEnum];

const stocksCache = new Map<string, StockInfo>();
const criptoCache = new Map<string, CriptoInfo>();



interface FCIAPIResponse {
    code: number,
    msg: string,
    response: {
        "c": string,
        "h": string,
        "l": string,
        "ch": string,
        "cp": string,
        "t": string,
        "s": string
    }[]
}


const KEYS = process.env.FCS_API_KEYS.split(',').map(k => k.trim());
let currentKeyIndex = 0;
let loopCounter = 0;


function rotateKey() {
    currentKeyIndex++;
    if (currentKeyIndex > 1) {
        currentKeyIndex = 0;
    }
}

function getCurrentKey() {
    return KEYS[currentKeyIndex];
}

async function retrieveData<T>(dataType: DataType, ...tickers: string[]): Promise<FinancialAPIRequestResult<T>> {
    const searchValue = tickers.join(',')
    const apiResult = await fetch(`https://fcsapi.com/api-v3/${dataType}/latest?symbol=${searchValue}&access_key=${getCurrentKey()}`).then(async r => (await r.json()) as FCIAPIResponse);

    if ([211, 213].includes(apiResult.code) && loopCounter < KEYS.length) {
        console.log(`Limite de uso da API ${currentKeyIndex + 1} excedido, rotacionando key.`);
        rotateKey();
        loopCounter++
        return retrieveData(dataType, ...tickers);
    }
    if (apiResult.code !== 200) {
        throw new Error("API Retornou diferente de 200.\n" + apiResult.code + "\n" + apiResult.msg);
    }

    const returnValues: StockInfo[] | CriptoInfo[] = [];
    for (const result of apiResult.response) {
        const { c, h, l, t, cp, s } = result;
        returnValues.push({
            ticker: s,
            price: parseFloat(c),
            highPrice: parseFloat(h),
            lowPrice: parseFloat(l),
            lastUpdate: parseInt(t),
            dailyChangeInPercent: parseFloat(cp.replace('%', ''))
        })
    }
    loopCounter = 0;
    return {
        success: returnValues as T[],
        failed: []
    };
}

export async function getStockInfo(tickers: string[]): Promise<FinancialAPIRequestResult<StockInfo>> {
    const tickersInfo: StockInfo[] = [];

    const tickersToRetrieve: string[] = [];

    for (const ticker of tickers) {
        let tickInfo = stocksCache.get(ticker);
        if (tickInfo) {
            const { lastUpdate } = tickInfo;
            if (hasCacheTimeExpired(lastUpdate)) {
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
            const results = await retrieveData<StockInfo>(DataTypeEnum.STOCK, ...tickersToRetrieve);
            for (const result of results.success) {
                stocksCache.set(result.ticker, result);
                tickersInfo.push(result)
            }
        } catch (e) {
            console.log(e);
        }
    }
    return {
        success: tickersInfo.sort((a, b) => { if (a.ticker > b.ticker) return 1; if (b.ticker > a.ticker) return -1; return 0; }),
        failed: []
    }
}

export async function getCriptoInfo(ticker: string) {
    let tickInfo = criptoCache.get(ticker);
    if (tickInfo) {
        if (hasCacheTimeExpired(tickInfo.lastUpdate)) {
            tickInfo = (await retrieveData<CriptoInfo>(DataTypeEnum.CRYPTO, ticker))[0]
        }
    } else {
        tickInfo = (await retrieveData<CriptoInfo>(DataTypeEnum.CRYPTO, ticker)).success[0]
    }
    criptoCache.set(ticker, tickInfo);
    return tickInfo
}

function hasCacheTimeExpired(cachedTime: number) {
    const nowDate = new Date();

    if (nowDate.getDay() === 0 || nowDate.getDay() === 6) return false;
    if (nowDate.getHours() < 10 || nowDate.getHours() > 18) return false

    return (new Date().getTime() / 1000) > (cachedTime + (60 * 60));
}

export function getSymbolFor(name) {
    switch (name) {
        case 'brl': return 'R$';
        case 'usd': return 'U$';
        default: return '$';
    }
}