import { Chat, Client, GroupChat, Message } from "whatsapp-web.js";
import { Command } from "./command.interface";

export class MentionAllAdminsCommand implements Command {
    command = '@admin';
    alternativeCommands = [];
    usage = `
*/admin*
 _Marca os admins do grupo_`
    async isValid(chat: Chat, ...argsArray: string[]): Promise<boolean> {
        return chat.isGroup;

    }
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

        await chat.sendMessage(text, { mentions });
    }

}
