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
import { CriptoCommand } from './commands/cripto';
import { DaniBotCommand } from './commands/danibot';
import { GetIdCommand } from './commands/getId';
import { PiadaCommand } from './commands/piada/piada.command';
import { SairCommand } from './commands/sair';
import { SelicCommand } from './commands/selic';
import { TempoCommand } from './commands/tempo';
import { TickerCommand } from './commands/ticker';
import { TrackerCommand } from './commands/tracker/tracker';
import { TranscreverCommand } from './commands/transcrever';
import { B3UnitsCommand } from './commands/units';


import { GroupAdminCommand } from './commands/adminstrative/group-admin.command';
import { ApostaCommand } from './commands/aposta/aposta.command';
import { PokedexCommand } from './commands/pokedex/pokedex.command';
import { RadarCommand } from './commands/radar/radar.command';
import { StravaCommand } from './commands/strava/strava.command';
import { TheOfficeCommand } from './commands/the-office/the-office.command';
import { WalletCommand } from './commands/wallet/wallet.command';
import { GroupAdminUnlockerRunner } from './runners/group-admin/unlocker.runner';

import { Runner } from './runners/interfaces/runner.interface';
import { randomIntFromInterval } from './utils/util';
import { isId } from './utils/whatsapp.util';

const USE_WEB_CACHE_VERSION = process.env.USE_WEB_CACHE_VERSION

const config = {
    authStrategy: new LocalAuth({ clientId: IS_PRODUCTION ? WCLIENT_ID : undefined, dataPath: IS_PRODUCTION ? "/app/auth_data" : undefined }),
    puppeteer: {
        args: ['--no-sandbox'],
    }
}

if (USE_WEB_CACHE_VERSION) {
    console.log("Using web cache version ", USE_WEB_CACHE_VERSION)
    config['webVersionCache'] = {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${USE_WEB_CACHE_VERSION}.html`,
    }
}


const client = new Client(config);

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
        registerCommand(normalizeCommand(handler.command, true), handler, RegisteredHandlers);
        for (const command of handler.alternativeCommands) {
            registerCommand(normalizeCommand(command, true), handler, RegisteredHandlers);
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
    TempoCommand,
    GetIdCommand,
    MentionAllCommand,
    MentionAllAdminsCommand,
    DaniBotCommand,
    TranscreverCommand,
    B3UnitsCommand,
    SelicCommand,
    TrackerCommand,
    WalletCommand,
    RadarCommand,
    GroupAdminCommand,
    ApostaCommand,
    StravaCommand,
    TheOfficeCommand,
    PokedexCommand,
    PiadaCommand
]

const runners: Constructor<Runner>[] = [
    GroupAdminUnlockerRunner,
    //RadarAlertsRunner
];

const normalizeCommand = (command: string, forRegister: boolean = false) => {
    if(forRegister && !IS_PRODUCTION) {
        command += '-dev';
    }    
    return command.toLocaleLowerCase()
}

const registerCommand = (command: string, handler: Command, handlers: CommandMap) => {

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

        const [command, ...argsArray] = msg.body.replace(/\xA0/g," ").split(" ").map(a => a.trim()).filter(arg => !!arg.trim());
        const normalizedCommand = normalizeCommand(command)
        const handler = RegisteredHandlers[normalizedCommand]
        if (handler) {
            console.info(`Message contains a registered command ${normalizedCommand}`);
            //if (await handler.isUseAllowed(chat.id._serialized, chat.isGroup)) {
                
                if (await handler.isUsageValid(chat, msg, ...argsArray)) {
                    try {
                        console.info(`Calling handler for ${normalizedCommand}`);
                        await handler.handle(client, chat, msg, ...argsArray);
                    } catch (e) {
                        console.error(`Erro ao processar comando ${normalizedCommand}`)
                        console.error(e);
                    }
                } else {
                    await msg.reply("Comando Inválido! Modo de uso:\n\n" + handler.usage)
                }
            // } else {

            // }
        }

        const textMessage = msg.body.toLowerCase();
        for (const reaction of REACTIONS) {
            for (const keyworkd of reaction.keywords) {
                for (const word of textMessage.split(" ")) {
                    if (word.toLowerCase() === keyworkd.toLowerCase()) {
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
