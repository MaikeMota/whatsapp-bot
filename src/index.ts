import { config as dotEnvConfig } from 'dotenv'

dotEnvConfig();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DUMP_MESSAGE = process.env.DUMP_MESSAGE === 'true';

import * as  qrcode from 'qrcode-terminal';

import { Client, LocalAuth, Message } from 'whatsapp-web.js';

import { Constructor } from './utils/constructor';

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
import { B3UnitsCommand } from './commands/units';
import { Command } from './commands/command.interface';

import { Runner } from './runners/interfaces/runner.interface';
import { VDAViewsNotifyerRunner } from "./runners/vda/VDA-views-notifyer.runner";
import { VDASubscribersNotifyerRunner } from "./runners/vda/VDA-subscribers-notifyer.runner";

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});


client.on('auth_failure', console.log)
client.on('loading_screen', console.log)

type RunningRunner = {
    intervalId: NodeJS.Timer;
    runner: Runner;
};

const runningRunners: RunningRunner[] = []

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', async () => {
    console.log('Client is ready!');
    console.log(`WhatsApp Web v${await client.getWWebVersion()}`);
    console.log(`WWebJS v${require('whatsapp-web.js').version}`);

    handlers.forEach((handlerConstructor) => {
        const handler = new handlerConstructor();
        registerCommand(handler.command, handler, RegisteredHandlers);
        for (const command of handler.alternativeCommands) {
            registerCommand(command, handler, RegisteredHandlers);
        }
    });

    runners.forEach(runnerConstructor => {
        const runner = new runnerConstructor();
        console.info(`Registering runner ${runner.name} to run every ${runner.runEveryNMinutes} minut(s)`)
        runner.run(client);
        const interval = setInterval(() => {
            runner.run(client)
        }, runner.runEveryNMinutes * 60 * 1000)
        runningRunners.push({
            intervalId: interval,
            runner
        })
    })
    console.info(`
    Available commands:\n
    ${Object.keys(RegisteredHandlers).join("\n")}`)
});


const handlers: Constructor<Command>[] = [
    TickerCommand,
    CriptoCommand,
    SairCommand,
    VDACommand,
    TempoCommand,
    GetIdCommand,
    MentionAllCommand,
    MentionAllAdminsCommand,
    DaniBotCommand,
    TranscreverCommand,
    B3UnitsCommand
]

const runners: Constructor<Runner>[] = [
    VDASubscribersNotifyerRunner,
    VDAViewsNotifyerRunner
];

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



const handleMessage = async (msg: Message) => {

    const chat = await msg.getChat();

    console.info(`Received message from ${msg['_data'].notifyName} at ${chat.name}: `);

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


process.on('exit ', shutdown);

async function shutdown(event) {
    console.info(`${event} signal received.`);
    console.log('Closing runners.');

    const shutdownSequences = [];
    for (const runningRunner of runningRunners) {
        clearInterval(runningRunner.intervalId);
        shutdownSequences.push(runningRunner.runner.shutdown());
    }
    await Promise.all(shutdownSequences);
    await client.destroy();
}
