export function hasCategorySuffix(ticker: string): boolean {
    return ticker.match(/[0-9]{1,2}$/)?.length > 0
}