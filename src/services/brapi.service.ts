import { FinancialAPIRequestResult } from "./financial-api-request-result.interface";
import { StockInfo } from "./stock-info.interface";

const BRAPI_KEY = process.env.BRAPI_KEY;

export async function getStockInfo(tickers: string[]): Promise<FinancialAPIRequestResult<StockInfo>> {

    const apiResult = await fetch(`https://brapi.dev/api/quote/${tickers.join(',')}?interval=1d`, {
        headers: getHeaders()
    }).then(r => r.json() as Promise<BRAPIResponse>);

    const results: FinancialAPIRequestResult<StockInfo> = {
        success: [],
        failed: []
    }

    for (const brAPITickerInfo of apiResult.results) {
        if (brAPITickerInfo?.error) {
            results.failed.push(brAPITickerInfo.symbol);
            continue;
        }
        results.success.push({
            businessName: brAPITickerInfo.longName,
            ticker: brAPITickerInfo.symbol,
            price: brAPITickerInfo.regularMarketPrice,
            lowPrice: brAPITickerInfo.regularMarketDayLow,
            low52WeekPrice: brAPITickerInfo.fiftyTwoWeekLow,
            highPrice: brAPITickerInfo.regularMarketDayHigh,
            high52WeekPrice: brAPITickerInfo.fiftyTwoWeekHigh,
            dailyChangeInPercent: brAPITickerInfo.regularMarketChangePercent,
            lastUpdate: new Date(brAPITickerInfo.regularMarketTime).getTime()
        })
    }

    return results

}

function getHeaders() {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${BRAPI_KEY}`)
    return headers;
}

export async function getAvailableTickersFor(prefix: string): Promise<string[]> {
    const apiResult = await fetch(`https://brapi.dev/api/available?search=${prefix}`, {
        headers: getHeaders()
    }).then(r => r.json() as Promise<BRAPITickerAvailablesResponse>);
    return apiResult.stocks.filter(s => !s.toLowerCase().endsWith("f"));
}

interface BRAPITickerAvailablesResponse {
    indexes: string[];
    stocks: string[];
}

interface BRAPIResponse {
    results: BRAPITickerInfoResult[];
    requestedAt: string;
}


export interface BRAPITickerInfoResult {
    error?: boolean;
    symbol: string;
    shortName: string;
    longName: string;
    currency: string;
    regularMarketPrice: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketDayRange: string;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketTime: string;
    marketCap: number;
    regularMarketVolume: number;
    regularMarketPreviousClose: number;
    regularMarketOpen: number;
    averageDailyVolume10Day: number;
    averageDailyVolume3Month: number;
    fiftyTwoWeekLowChange: number;
    fiftyTwoWeekLowChangePercent: number;
    fiftyTwoWeekRange: string;
    fiftyTwoWeekHighChange: number;
    fiftyTwoWeekHighChangePercent: number;
    fiftyTwoWeekLow: number;
    fiftyTwoWeekHigh: number;
    twoHundredDayAverage: number;
    twoHundredDayAverageChange: number;
    twoHundredDayAverageChangePercent: number;
}
