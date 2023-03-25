
export function asPercentageString(value: number, locale = "pt-BR") {
    return `${(+value.toFixed(2)).toLocaleString(locale)}%`
}