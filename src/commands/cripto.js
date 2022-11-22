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

        msg.reply(`*${ticker.toUperCase()}*: *${getSymbolFor(pair2)} ${tickInfo.c}* (${tickInfo.cp})

Mínima: ${getSymbolFor(pair2)} ${tickInfo.l}
Máxima: ${getSymbolFor(pair2)} ${tickInfo.h}

*Última atualização às ${horaAtualizacao}...*`)

    }
};

module.exports = { handler }