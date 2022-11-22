const { getSymbolFor, getCriptoInfo } = require("../services/fcs-api.service");

const handler = {
    command: '/cripto',
    alternativeCommands: ['/crypto'],
    usage: `/cripto symbol\n
/cripto symbol/currency\n
/cripto eth/usd`,
    isValidParams: (_, argsArray) => {
        const [args] = argsArray;
        const [symbol] = args.split('/');
        return !!symbol;
    },
    handle: async (_, __, msg, argsArray) => {
        const [args] = argsArray;
        let [pair1, pair2] = args.split('/');
        if (!pair2) {
            pair2 = 'brl'
        }

        ticker = `${pair1}/${pair2}`;
        tickInfo = await getCriptoInfo(ticker)

        if (!tickInfo) {
            msg.reply(`Não consegui encontrar informações sobre o preço de ${ticker}`);
            return
        }

        const lastUpdateDate = new Date(tickInfo.t * 1000)
        const horaAtualizacao = lastUpdateDate.toLocaleTimeString()
        const symbol = getSymbolFor(pair2)
        msg.reply(getMessageForUser(ticker, symbol, tickInfo, horaAtualizacao))

    }
};

module.exports = { handler }

function getMessageForUser(ticker, symbol, tickInfo, horaAtualizacao) {
    return `*${ticker.toUpperCase()}*: *${symbol} ${tickInfo.c}* (${tickInfo.cp})

Mínima: ${symbol} ${tickInfo.l}
Máxima: ${symbol} ${tickInfo.h}

*Última atualização às ${horaAtualizacao}...*`;
}
