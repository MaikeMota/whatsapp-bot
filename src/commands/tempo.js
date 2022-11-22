const { getWheater } = require('../services/wheater.service');

const handler = {
    command: '/tempo',
    alternativeCommands: [],
    usage: `*/tempo nome da sua cidade*
    _Retorna dados sobre o tempo na cidade digitada_
`,
    isValidParams: (_, argsArray) => {
        return argsArray.length > 0
    },
    handle: async (client, _, msg, argsArray) => {
        cidade = '';
        if (argsArray.length > 1) {
            cidade = argsArray.join(' ');
        } else {
            cidade = argsArray[0];
        }
        const wheaterInfo = await getWheater(cidade);

        if (wheaterInfo) {
            const { temp, temp_min, temp_max, feels_like, humidity } = wheaterInfo;
            await msg.reply(getWheaterMessage(temp, humidity, temp_min, temp_max, feels_like))
        } else {
            await msg.reply(`Não consegui encontrar detalhes do tempo para a cidade de *${cidade}*, tente digitar o nome completo, sem abreviações.`);
        }
    }
};

function getWheaterMessage(temp, humidity, temp_min, temp_max, feels_like) {
    return `Agora em *${cidade}* fazem *${temp}* ºC 
Umidade relativa do ar em ${humidity}%

Minima:             *${temp_min}* ºC
Máxima:             *${temp_max}* ºC
Sensação Térmica :  *${feels_like}* ºC`;
}




module.exports = { handler }