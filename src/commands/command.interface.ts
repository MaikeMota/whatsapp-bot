import { Chat, Client, Message } from "whatsapp-web.js";

export interface Command {
    isValid: (chat: Chat, ...argsArray: string[]) => Promise<boolean>
    handle: (client: Client, chat: Chat, msg: Message, ...argsArray: string[]) => Promise<void>
}