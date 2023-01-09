import { Chat, Client, Message } from "whatsapp-web.js";

export interface Command {
    command: string;
    alternativeCommands: string[];
    usage: string;
    isValid: (chat: Chat, msg: Message, ...argsArray: string[]) => Promise<boolean>
    handle: (client: Client, chat: Chat, msg: Message, ...argsArray: string[]) => Promise<void>
}