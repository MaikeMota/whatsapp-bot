export function hasCategorySuffix(ticker: string): boolean {
    return ticker.match(/[0-9]{1,2}$/)?.length > 0
}

export function tickerInfoToOneLineString(tickerInfo) { 
    return `${tickerInfo.ticker.toUpperCase()}:\t*R$ ${tickerInfo.c.replace('.', ',')}* (${parseFloat(tickerInfo.cp) > 0 ? '+' : ''}${tickerInfo.cp.replace('.', ',')})`
}