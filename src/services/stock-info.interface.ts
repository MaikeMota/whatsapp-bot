export interface StockInfo {
    businessName: string;
    ticker: string;
    price: number;
    lowPrice: number;
    low52WeekPrice: number;
    highPrice: number;
    high52WeekPrice: number
    lastUpdate: number;
    dailyChangeInPercent: number;
}