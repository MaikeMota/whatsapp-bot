const { getLatestVideo, getChannelSubs } = require('../services/youtube.service');

const VIDEO_SUBCOMMANDS = ["video", "vídeo"];
const INSCRITOS_SUBCOMMANDS = ["inscritos"]

const AVAILABLE_SUBCOMMANDS = [...VIDEO_SUBCOMMANDS, ...INSCRITOS_SUBCOMMANDS]

const handler = {
    command: '/vda',
    alternativeCommands: ['/vidacionista'],
    usage: `
*/vda vídeo*
*/vidacionista vídeo*
    _Exibe o último video publicado no canal Vida de Acionista._

*/vda inscritos*
*/vidacionista inscritos*
    _Exibe a contagem de escritos no canal Vida de Acionista._`,
    isValidParams: (argsArray) => {
        const [firstArg] = argsArray;
        return AVAILABLE_SUBCOMMANDS.includes(firstArg);
    },
    handle: async (argsArray, msg, chat) => {

        const [firstArg] = argsArray;
        if (VIDEO_SUBCOMMANDS.includes(firstArg)) {
            await handleVideoCommand(chat);

        } else if (INSCRITOS_SUBCOMMANDS.includes(firstArg)) {
            await handleInscritosCommand(msg);
        }

    }
};

module.exports = { handler }

async function handleInscritosCommand(msg) {
    const inscritos = await getChannelSubs();
    await msg.reply(`Atualmente temos ${inscritos} inscritos.`).catch(console.log);
}

async function handleVideoCommand(chat) {
    const { title, messageMedia, videoUrl } = await getLatestVideo();
    await chat.sendMessage(messageMedia, {
        caption: `${title}\n\n${videoUrl}`
    });
}
