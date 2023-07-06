import { config as dotEnvConfig } from 'dotenv';

dotEnvConfig();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DUMP_MESSAGE = process.env.DUMP_MESSAGE === 'true';

const WCLIENT_ID = process.env.WCLIENT_ID || IS_PRODUCTION ? "PROD_CLIENT" : "DEV_CLIENT";

interface MessageReaction {
    keywords: string[];
    reactions: string[];
    allowedGroups: string[];
}

interface ChatGroups { 
    name: string;
    ids: string[];
}

const CHATGROUPS: ChatGroups[] = JSON.parse(process.env.CHATGROUPS);
const REACTIONS: MessageReaction[] = JSON.parse(process.env.REACTIONS);

import * as qrcode from 'qrcode-terminal';

import { Client, LocalAuth, Message } from 'whatsapp-web.js';

import { Command } from './commands/command';
import { Constructor } from './utils/constructor';

import { MentionAllAdminsCommand } from './commands/adminstrative/adms';
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


import { GroupAdminCommand } from './commands/adminstrative/group-admin.command';
import { RadarCommand } from './commands/radar/radar.command';
import { GroupAdminUnlockerRunner } from './runners/group-admin/unlocker.runner';
import { Runner } from './runners/interfaces/runner.interface';
import { VDASubscribersNotifyerRunner } from "./runners/vda/VDA-subscribers-notifyer.runner";
import { VDAViewsNotifyerRunner } from "./runners/vda/VDA-views-notifyer.runner";
import { randomIntFromInterval } from './utils/util';
import { isId } from './utils/whatsapp.util';

const client = new Client({
    authStrategy: new LocalAuth({ clientId: IS_PRODUCTION? WCLIENT_ID: undefined, dataPath: IS_PRODUCTION? "/app/auth_data": undefined }),
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
    RadarCommand,
    GroupAdminCommand
]

const runners: Constructor<Runner>[] = [
    VDASubscribersNotifyerRunner,
    VDAViewsNotifyerRunner,
    GroupAdminUnlockerRunner
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

    if (msg.isStatus) { return; }

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

        const textMessage = msg.body.toLowerCase();
        for (const reaction of REACTIONS) {
            for (const keyworkd of reaction.keywords) {
                if (textMessage.includes(keyworkd)) {
                    for (const allowedGroup of reaction.allowedGroups) {
                        let shouldReact = false;
                        if (isId(allowedGroup)) {
                            shouldReact = chat.id._serialized === allowedGroup;
                        } else {
                            const chatList = CHATGROUPS.find(chatGroup => chatGroup.name === allowedGroup)
                            shouldReact = !!chatList && chatList.ids.includes(chat.id._serialized);
                        }
                        if (shouldReact) {
                            const randomReaction = reaction.reactions[randomIntFromInterval(0, reaction.reactions.length - 1)];
                            return await msg.react(randomReaction);
                        }
                    }
                }
            }
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

