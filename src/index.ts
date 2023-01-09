import { config as dotEnvConfig } from 'dotenv'

dotEnvConfig();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DUMP_MESSAGE = process.env.DUMP_MESSAGE === 'true';

import * as  qrcode from 'qrcode-terminal';

import { Client, LocalAuth } from 'whatsapp-web.js';

import { SairCommand } from './commands/sair';
import { TranscreverCommand } from './commands/transcrever';
import { MentionAllCommand } from './commands/all';
import { MentionAllAdminsCommand } from './commands/adms';
import { CriptoCommand } from './commands/cripto';
import { DaniBotCommand } from './commands/danibot';
import { GetIdCommand } from './commands/getId';
import { TempoCommand } from './commands/tempo';
import { TickerCommand } from './commands/ticker';
import { VDACommand } from './commands/vda';
import { Command } from './commands/command.interface';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', async () => {
    console.log('Client is ready!');
    console.log(`WhatsApp Web v${await client.getWWebVersion()}`);
    console.log(`WWebJS v${require('whatsapp-web.js').version}`,);
});


const handlers: Command[] = [
    new TickerCommand(),
    new CriptoCommand(),
    new SairCommand(),
    new VDACommand(),
    new TempoCommand(),
    new GetIdCommand(),
    new MentionAllCommand(),
    new MentionAllAdminsCommand(),
    new DaniBotCommand(),
    new TranscreverCommand()
]

const registerCommand = (command: string, handler: Command, handlers) => {
    command = IS_PRODUCTION ? command : `${command}-dev`
    if (handlers[command]) {
        console.error(`Já existe um handler para o comando ${command}`)
    } else {
        console.info(`Registrando comando ${command}`)
        handlers[command] = handler;
    }
}

const RegisteredHandlers: { [key: string]: Command } = {}
handlers.forEach((handler) => {
    registerCommand(handler.command, handler, RegisteredHandlers);
    for (const command of handler.alternativeCommands) {
        registerCommand(command, handler, RegisteredHandlers);
    }
});



console.info(`
Available commands:\n
${Object.keys(RegisteredHandlers).join("\n")}`)

const handleMessage = async (msg) => {

    const chat = await msg.getChat();

    console.info(`Received message from ${msg._data.notifyName} at ${chat.name}: `);

    if (DUMP_MESSAGE) {
        console.info(JSON.stringify(msg, null, 4));
    }

    if (typeof msg.body === 'string') {

        const [command, ...argsArray] = msg.body.split(" ");
        const handler = RegisteredHandlers[command]
        if (handler) {
            console.info(`Message contains a registered command ${command}`);
            if (await handler.isValid(chat, msg, ...argsArray)) {
                try {
                    console.info(`Calling handler for ${command}`);
                    await handler.handle(client, chat, msg, ...argsArray);
                } catch (e) {
                    console.error(`Erro ao processar comando ${command}`)
                    console.error(e);
                }
            } else {
                await msg.reply("Comando Inválido! Modo de uso: \n" + handler.usage)
            }
        }
    }

    //   if (chat.name.includes('Knife') || chat.name.includes('NEUROSE')) {
    //                 if (new Date().getTime() % 13 === 0) {
    //                     chat.sendMessage(chat.id, `[DaniBot] says: ${lerolero()}`).catch(console.log);
    //                 } else if (new Date().getTime() % 17 === 0) {
    //                     chat.sendMessage(chat.id, `😂😂😂😂`).catch(console.log);
    //                 } else {

    //                     if (typeof msg.body === "string" && msg.body.toLowerCase().includes('china')) {
    //                         msg.reply('🇨🇳');
    //                         return
    //                     }

    //                     const contact = await msg.getContact();
    //                     if (contact.number === "554399388488") {

    //                         if (msg.body === '@554399867608 uq se acha?') {
    //                             msg.replY(lerolero())
    //                         } else {
    //                             const n = randomIntFromInterval(1, 6)
    //                             const reply = n === 3;

    //                             if (reply) {
    //                                 const options = ["xama", "🔥", "🔥🔥 no kwai", "estourou no kwai", "jogador caro", "Tchaaaco"];
    //                                 msg.reply(options[randomIntFromInterval(0, options.length - 1)]);
    //                             } else {
    //                                 console.log(`Sorted number ${n}... not this time...`)
    //                             }
    //                         }

    //                     }
    //                 }

    //             }

    //         }

}

const frasesBruno = ["ah velho, pára mano"]

client.on('message_create', handleMessage);

client.initialize();