import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command.interface";

export class GetIdCommand implements Command {
    command = '/getId';
    alternativeCommands = [];
    usage = `
*/getId*
 _Retorna o ID do grupo_`;
    async isValid(chat: Chat, ...argsArray: string[]): Promise<boolean> {
        return true;
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (msg.fromMe) {
            await msg.reply(chat.id._serialized);
        }
    }
}