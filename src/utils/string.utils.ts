
export function asPercentageString(value: number, locale = "pt-BR") {
    return `${(+value.toFixed(2)).toLocaleString(locale)}%`
}

export function formatString(str: string, ...args: string[]) {
    let i=0;
    return str.replace(/{}/g, () => args[i++]);
}