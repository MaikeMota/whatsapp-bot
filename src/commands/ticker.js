const { getStockInfo } = require("../services/fcs-api.service");


const handler = {
    command: '/ticker',
    alternativeCommands: ['/cotação'],
    usage: '/ticker tickerDaEmpresa',
    isValidParams: (_, argsArray) => {
        const [args] = argsArray;
        const [ticker] = args.split(' ');
        return !!ticker;
    },
    handle: async (_, __, msg, argsArray) => {

        const isMultiple = argsArray.length > 1

        if (isMultiple) {

            const results = await getStockInfo(argsArray);

            let tickersMessage = ""
            for (const result of results) {
                tickersMessage += getOneLineTickerMessage(result) + "\n"
            }

            msg.reply(`${tickersMessage}`)

        } else {
            const [args] = argsArray;

            ticker = args.toLowerCase();
            const ticksInfo = await getStockInfo(ticker);
            const tickInfo = ticksInfo[0];
            if (!tickInfo) {
                msg.reply(`Não consegui encontrar informações sobre o preço de ${ticker}`);
                return;
            }
            const lastUpdateDate = new Date(tickInfo.t * 1000);
            const horaAtualizacao = lastUpdateDate.toLocaleTimeString();

            msg.reply(getTickerMessage(tickInfo, horaAtualizacao));
        }

    }
};

function getOneLineTickerMessage(tickInfo) {
    return `*${tickInfo.ticker.toUpperCase()}*: *R$ ${tickInfo.c}* (${tickInfo.cp})`
}

function getTickerMessage(tickInfo, horaAtualizacao) {
    return `*${tickInfo.ticker.toUpperCase()}*: *R$ ${tickInfo.c}* (${tickInfo.cp})

Mínima: R$ ${tickInfo.l}
Máxima: R$ ${tickInfo.h}

*Última atualização às ${horaAtualizacao}...*`;
}

module.exports = { handler }