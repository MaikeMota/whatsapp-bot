
export function asPercentageString(value: number, locale = "pt-BR") {
    return `${(+value.toFixed(2)).toLocaleString(locale)}%`
}

export function formatString(str: string, ...args: string[]) {
    let i=0;
    return str.replace(/{}/g, () => args[i++]);
}

export function pluralize(value: number, singular: string, plural: string, zeroValue: string) {
    if(!value || value === 0) {
        return `${zeroValue} ${singular}`;
    }
    return `${value} ${value === 1 ? singular : plural}`;
}