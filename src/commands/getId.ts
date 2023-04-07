import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

export class GetIdCommand extends Command {
    command = '/getId';
    
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (msg.fromMe) {
            await msg.reply(chat.id._serialized);
        }
    }
}