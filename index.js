require('dotenv').config()

const qrcode = require('qrcode-terminal');

const { Client, } = require('whatsapp-web.js');

const { handler: tickerHandler } = require('./src/commands/ticker')
const { handler: criptoHandler } = require('./src/commands/cripto')
const { handler: sairHandler } = require('./src/commands/sair')
const { handler: vdaHandler } = require('./src/commands/vda')
const { handler: tempoHandler } = require('./src/commands/tempo')




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
    tempoHandler
]

registerCommand = (command, handler, handlers) => {
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
            if (handler.isValidParams(argsArray)) {
                try {
                    console.info(`Calling handler for ${command}`);
                    await handler.handle(argsArray, msg, chat);
                } catch (e) {
                    console.error(`Erro ao processar comando ${command}`)
                    console.error(e);
                }
            } else {
                await msg.reply("Comando Inválido! Modo de uso: \n" + handler.usage)
            }
        }
    }


    //if (typeof msg.body === "string" && msg.body.startsWith("/tempo")) {
    //             let [_, ...args] = msg.body.split(' ');
    //             if (args && args.length > 1) {
    //                 cidade = args.join(' ');
    //             } else {
    //                 cidade = args[0];
    //             }
    //             if (!cidade) {
    //                 cidade = 'londrina';
    //             }

    //             const wheaterInfo = await getWheater(cidade);

    //             if (wheaterInfo) {

    //                 const { temp, temp_min, temp_max, feels_like, humidity } = wheaterInfo;


    //                 msg.reply(`Agora em ${cidade} fazem ${temp} ºC 
    // Umidade relativa do ar em ${humidity}%

    // Minima:             ${temp_min} ºC
    // Máxima:             ${temp_max} ºC
    // Sensação Térmica :  ${feels_like} ºC`)
    //             } else {
    //                 msg.reply(`Não consegui encontrar detalhes do tempo para a cidade ${cidade}, tente digitar o nome completo, sem abreviações.`);
    //             }

    //         } else  if (msg.body === "/getId") {
    //             msg.reply(chat.id._serialized)

    //         } else if (msg.body === "@adm") {
    //             if (chat.isGroup) {
    //                 let text = "";
    //                 let mentions = [];

    //                 for (let participant of chat.participants) {
    //                     const contact = await client.getContactById(participant.id._serialized);
    //                     if (participant.isAdmin || participant.isSuperAdmin) {
    //                         mentions.push(contact);
    //                         text += ` @${participant.id.user}`;
    //                     }
    //                 }

    //                 await chat.sendMessage(text, { mentions });
    //             }

    //         } else if (msg.body === "@all") {
    //             if (chat.isGroup) {
    //                 let text = "";
    //                 let mentions = [];

    //                 for (let participant of chat.participants) {
    //                     const contact = await client.getContactById(participant.id._serialized);
    //                     mentions.push(contact);
    //                     text += ` @${participant.id.user}`;
    //                 }

    //                 await chat.sendMessage(text, { mentions });
    //             }
    //         } else if (msg.body == '!danibot') {
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


