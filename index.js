require('dotenv').config()

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const qrcode = require('qrcode-terminal');

const { Client, } = require('whatsapp-web.js');

const { handler: tickerHandler } = require('./src/commands/ticker')
const { handler: criptoHandler } = require('./src/commands/cripto')
const { handler: sairHandler } = require('./src/commands/sair')
const { handler: vdaHandler } = require('./src/commands/vda')
const { handler: tempoHandler } = require('./src/commands/tempo')
const { handler: getIdHandler } = require('./src/commands/getId')
const { handler: allHandler } = require('./src/commands/all')
const { handler: admsHandler } = require('./src/commands/adms')




DUMP_MESSAGE = false;

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox'],
    }
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready!');
    console.log("WhatsApp Web v", await client.getWWebVersion());
    console.log("WWebJS v", require("whatsapp-web.js").version);
});


let Handlers = [
    tickerHandler,
    criptoHandler,
    sairHandler,
    vdaHandler,
    tempoHandler,
    getIdHandler,
    allHandler,
    admsHandler
]

registerCommand = (command, handler, handlers) => {
    command = IS_PRODUCTION ? command : `dev-${command}`
    if (handlers[command]) {
        console.error(`Já existe um handler para o comando ${command}`)
    } else {
        console.info(`Registrando comando ${command}`)
        handlers[command] = handler;
    }
}

Handlers = Handlers.reduce((prev, handler, idx) => {

    registerCommand(handler.command, handler, prev);
    for (const command of handler.alternativeCommands) {
        registerCommand(command, handler, prev);
    }

    return prev;
}, {})




console.info(`
Available commands:\n
${Object.keys(Handlers).join("\n")}`)

const handleMessage = async (msg) => {

    const chat = await msg.getChat();

    console.info(`Received message from ${msg._data.notifyName} at ${chat.name}: `);

    if (DUMP_MESSAGE) {
        console.info(JSON.stringify(msg, null, 4));
    }

    if (typeof msg.body === 'string') {

        const [command, ...argsArray] = msg.body.split(" ");
        const handler = Handlers[command]
        if (handler) {
            console.info(`Message contains a registered command ${command}`);
            if (handler.isValidParams(chat, argsArray)) {
                try {
                    console.info(`Calling handler for ${command}`);
                    await handler.handle(client, chat, msg, argsArray);
                } catch (e) {
                    console.error(`Erro ao processar comando ${command}`)
                    console.error(e);
                }
            } else {
                await msg.reply("Comando Inválido! Modo de uso: \n" + handler.usage)
            }
        }
    }

    //   if (msg.body == '!danibot') {
    //             msg.reply(`[DaniBot] says: ${lerolero()}`).catch(console.log);
    //         } else {
    //             if (chat.name.includes('Knife') || chat.name.includes('NEUROSE')) {
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


