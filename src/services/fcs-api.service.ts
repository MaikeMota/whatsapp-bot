import { FinancialAPIRequestResult } from "./financial-api-request-result.interface";
import { CriptoInfo, StockInfo } from "./stock-info.interface";

const FCS_API_KEY = process.env.FCS_API_KEY;
const FCS_API_KEY_2 = process.env.FCS_API_KEY_2;

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

async function retrieveData<T>(dataType: DataType, ...tickers: string[]): Promise<FinancialAPIRequestResult<T>> {
    const searchValue = tickers.join(',')
    const apiResult = await fetch(`https://fcsapi.com/api-v3/${dataType}/latest?symbol=${searchValue}&exchange=BM%26FBovespa&access_key=${FCS_API_KEY}`).then(async r => (await r.json()) as FCIAPIResponse);

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
    return (new Date().getTime() / 1000) > (cachedTime + (60 * 60));
}

export function getSymbolFor(name) {
    switch (name) {
        case 'brl': return 'R$';
        case 'usd': return 'U$';
        default: return '$';
    }
}