const INTERVAL_BETWEEN_USES = 1 * 60 * 1000

const lastUses = {}
const lastWarnings = {}

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
    handle: async (client, chat, msg, __,) => {


        const key = `${chat.id}-${msg.author}`
        const lastUse = lastUses[key];
        const now = Date.now();
        
        if (lastUse && (now - lastUse) < INTERVAL_BETWEEN_USES) {

            const lastWarning = lastWarnings[key];
            if (lastWarning && (now - lastWarning) < INTERVAL_BETWEEN_USES) {
                return;
            }
            await msg.reply("Você não pode marcar todo mundo com tanta frequência!")
            lastWarnings[key] = now;

        } else {
            let text = "";
            let mentions = [];

            for (let participant of chat.participants) {
                const contact = await client.getContactById(participant.id._serialized);
                mentions.push(contact);
                text += ` @${participant.id.user}`;
            }
            await chat.sendMessage(text, { mentions });
            lastUses[key] = now;

        }
    }
};

module.exports = { handler }