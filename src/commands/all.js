const handler = {
    command: '@all',
    alternativeCommands: [],
    usage: `
*@all*
 _Marca todos os integrantes do grupo_
`,
    isValidParams: (chat, _) => {
        return chat.isGroup;
    },
    handle: async (client, chat, _, __,) => {
        let text = "";
        let mentions = [];

        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);
            mentions.push(contact);
            text += ` @${participant.id.user}`;
        }
        await chat.sendMessage(text, { mentions });
    }
};

module.exports = { handler }