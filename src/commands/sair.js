const { randomIntFromInterval } = require('../utils/util');

const handler = {
    command: '/sair',
    alternativeCommands: ['/exit', '/stop', '/quit', '/parar'],
    usage: '/sair',
    isValidParams: (_) => {
        return true;
    },
    handle: async (argsArray, msg, chat) => {
        await msg.reply(`para sair envie um pix de R$${randomIntFromInterval(5, 50)} para 43999867608`);
    }
};

module.exports = { handler }