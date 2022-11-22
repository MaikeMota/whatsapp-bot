const { getSymbolFor, getCriptoInfo } = require("../services/fcs-api.service");

const handler = {
    command: '/cripto',
    alternativeCommands: ['/crypto'],
    usage: `/cripto symbol\n
/cripto symbol/currency\n
/cripto eth/usd`,
    isValidParams: (argsArray) => {
        const [args] = argsArray;
        const [symbol] = args.split('/');
        return !!symbol;
    },
    handle: async (argsArray, msg, chat) => {
        const [args] = argsArray;
        const [symbol] = args.split('/');
        let [pair1, pair2] = symbol.split('/');
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

        msg.reply(`*${ticker}* (${tickInfo.cp})

Minima: ${getSymbolFor(pair2)} ${tickInfo.l}
Máxima: ${getSymbolFor(pair2)} ${tickInfo.h}
Atual : ${getSymbolFor(pair2)} ${tickInfo.c}


*Última atualização às ${horaAtualizacao}...*`)

    }
};

module.exports = { handler }