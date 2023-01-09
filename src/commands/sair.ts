import { randomIntFromInterval } from '../utils/util';

import { Client, Chat, Message } from 'whatsapp-web.js';
import { Command } from './command.interface';

export class SairCommand implements Command {
    command: string = '/sair';
    alternativeCommands: string[] = ['/exit', '/stop', '/quit', '/parar']
    usage: string;

    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        return true;
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        await msg.reply(`para sair envie um pix de R$${randomIntFromInterval(5, 50)} para 43999867608`);
    }

}