import { Client, GroupChat, Message } from "whatsapp-web.js";
import { Command } from "../command";

export class MentionAllAdminsCommand extends Command {
    command = '@admin';
    alternativeCommands = ['@admins', '@adms', '@adm']

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {

        let text = "";
        let mentions = [];
        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);
            if (participant.isAdmin || participant.isSuperAdmin) {
                mentions.push(contact);
                text += ` @${participant.id.user}`;
            }
        }

        text += `

${(await msg.getContact()).pushname} está chamando os administradores do grupo!`
        await msg.reply(text, chat.id._serialized, { mentions });
    }

}
