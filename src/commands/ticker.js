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
        const [args] = argsArray;
        ticker = args.toLowerCase();
        tickInfo = await getStockInfo(ticker);

        if (!tickInfo) {
            msg.reply(`Não consegui encontrar informações sobre o preço de ${ticker}`);
            return;
        }
        const lastUpdateDate = new Date(tickInfo.t * 1000);
        const horaAtualizacao = lastUpdateDate.toLocaleTimeString();

        msg.reply(getTickerMessage(ticker, tickInfo, horaAtualizacao));

    }
};

function getTickerMessage(ticker, tickInfo, horaAtualizacao) {
    return `*${ticker.toUpperCase()}*: *R$ ${tickInfo.c}* (${tickInfo.cp})

Mínima: R$ ${tickInfo.l}
Máxima: R$ ${tickInfo.h}

*Última atualização às ${horaAtualizacao}...*`;
}

module.exports = { handler }