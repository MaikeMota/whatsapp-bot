import { config as dotEnvConfig } from 'dotenv';

dotEnvConfig();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DUMP_MESSAGE = process.env.DUMP_MESSAGE === 'true';

import * as qrcode from 'qrcode-terminal';

import { Client, LocalAuth, Message } from 'whatsapp-web.js';

import { Command } from './commands/command';
import { Constructor } from './utils/constructor';

import { MentionAllAdminsCommand } from './commands/adms';
import { MentionAllCommand } from './commands/all';
import { CarteiraCommand } from './commands/carteira';
import { CriptoCommand } from './commands/cripto';
import { DaniBotCommand } from './commands/danibot';
import { GetIdCommand } from './commands/getId';
import { SairCommand } from './commands/sair';
import { SelicCommand } from './commands/selic';
import { TempoCommand } from './commands/tempo';
import { TickerCommand } from './commands/ticker';
import { TrackerCommand } from './commands/tracker/tracker';
import { TranscreverCommand } from './commands/transcrever';
import { B3UnitsCommand } from './commands/units';
import { VDACommand } from './commands/vda';


import { RadarCommand } from './commands/radar/radar.command';
import { Runner } from './runners/interfaces/runner.interface';
import { VDASubscribersNotifyerRunner } from "./runners/vda/VDA-subscribers-notifyer.runner";
import { VDAViewsNotifyerRunner } from "./runners/vda/VDA-views-notifyer.runner";

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

    runners.forEach(async runnerConstructor => {
        const runner = new runnerConstructor();
        console.info(`Registering runner ${runner.runnerName} to run every ${runner.runEveryNMinutes} minute(s)`)
        const catchFn = (exception: Error) => console.error(`Error while trying to run ${runner.runnerName}`, exception)

        await runner.run(client).catch(catchFn);
        const interval = setInterval(async () => {
            await runner.run(client).catch(catchFn);
        }, runner.runEveryNMinutes * 60 * 1000);

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
    B3UnitsCommand,
    SelicCommand,
    TrackerCommand,
    CarteiraCommand,
    RadarCommand
]

const runners: Constructor<Runner>[] = [
    VDASubscribersNotifyerRunner,
    VDAViewsNotifyerRunner
];

const registerCommand = (command: string, handler: Command, handlers: CommandMap) => {
    command = IS_PRODUCTION ? command : `${command}-dev`
    if (handlers[command]) {
        console.error(`Já existe um handler para o comando ${command}`)
    } else {
        console.info(`Registrando comando ${command}`)
        handlers[command] = handler;
    }
}

type CommandMap = {
    [key: string]: Command;
};

const RegisteredHandlers: CommandMap = {}



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
            if (await handler.isUsageValid(chat, msg, ...argsArray)) {
                try {
                    console.info(`Calling handler for ${command}`);
                    await handler.handle(client, chat, msg, ...argsArray);
                } catch (e) {
                    console.error(`Erro ao processar comando ${command}`)
                    console.error(e);
                }
            } else {
                await msg.reply("Comando Inválido! Modo de uso:\n\n" + handler.usage)
            }
        }

        if(msg.body.toLowerCase().includes('china')){
            msg.react("🇨🇳")
        }

        if(msg.body.toLowerCase().includes('72h')){
            msg.react("🇧🇷")
        }
    }

}

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
