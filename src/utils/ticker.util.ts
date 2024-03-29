import { StockInfo } from "../services/stock-info.interface";

export function hasCategorySuffix(ticker: string): boolean {
    return ticker.match(/[0-9]{1,2}$/)?.length > 0
}

export function removeCategorySuffix(ticker: string): string {
    if (!ticker) return "";
    return ticker.replace(/[0-9]{1,2}/, "")
}

export function tickerInfoToOneLineString(tickerInfo: StockInfo) {
    return `${tickerInfo.ticker.toUpperCase()}:\t*R$ ${tickerInfo.price.toString().replace('.', ',')}* (${tickerInfo.dailyChangeInPercent > 0 ? '+' : ''}${tickerInfo.dailyChangeInPercent.toPrecision(2).replace('.', ',')}%)`
}

export function sortByMostNegativeDailyChange(a: StockInfo, b: StockInfo): number {
    return a.dailyChangeInPercent - b.dailyChangeInPercent;
}

export function resolveTicker(...argsArray: string[]) {
    let [ticker] = argsArray;
    if (!ticker) {
        return undefined;
    }
    return ticker.toUpperCase();
}