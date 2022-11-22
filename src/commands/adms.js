const handler = {
    command: '@admin',
    alternativeCommands: [],
    usage: `
*/admin*
 _Marca os admins do grupo_
`,
    isValidParams: (chat, _) => {
        return chat.isGroup;
    },
    handle: async (client, chat, _, __) => {
        let text = "";
        let mentions = [];

        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);
            if (participant.isAdmin || participant.isSuperAdmin) {
                mentions.push(contact);
                text += ` @${participant.id.user}`;
            }
        }

        await chat.sendMessage(text, { mentions });
    }
};

module.exports = { handler }