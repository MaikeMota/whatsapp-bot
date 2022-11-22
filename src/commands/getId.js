const handler = {
    command: '/getId',
    alternativeCommands: [],
    usage: `
*/getId*
 _Retorna o ID do grupo_
`,
    isValidParams: (_, __) => {
        return true;
    },
    handle: async (_, chat, msg, __) => {
        await msg.reply(chat.id._serialized);
    }
};

module.exports = { handler }