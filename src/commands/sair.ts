import { randomIntFromInterval } from '../utils/util';

import { Chat, Client, Message } from 'whatsapp-web.js';
import { Command } from './command';

export class SairCommand extends Command {
    command: string = '/sair';
    alternativeCommands: string[] = ['/exit', '/stop', '/quit', '/parar']
    
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        await msg.reply(`para sair envie um pix de R$${randomIntFromInterval(5, 50)} para 43999867608`);
    }

}