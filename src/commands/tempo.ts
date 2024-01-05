import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command";

const { getWheater } = require('../services/wheater.service');

export class TempoCommand extends Command {
    command = '/tempo';

    usageDescription = '<cidade> - Recupera a previsão do tempo para a cidade informada.'

    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        return argsArray.length > 0
    }

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        let cidade = argsArray.join(' ');

        const ampersandIndex = cidade.indexOf('&');
        const hasAmpersand = ampersandIndex > -1;
        if (hasAmpersand) {
            await msg.reply("tô vendo essa zoeira ai!!!!", (await (msg.getContact())).id._serialized);
            cidade = cidade.substring(0, ampersandIndex).trim();
        }

        if(!hasAmpersand && cidade.length === 0) {
            await msg.reply("Você precisa informar uma cidade para eu consultar a previsão do tempo.");
            return;
        }
        const wheaterInfo = await getWheater(cidade);

        if (!hasAmpersand && !wheaterInfo) {
            await msg.reply(`Não consegui encontrar detalhes do tempo para a cidade de *${cidade}*, tente digitar o nome completo, sem abreviações.`);
            return
        }

        const { temp, temp_min, temp_max, feels_like, humidity } = wheaterInfo;
        await msg.reply(this.getWheaterMessage(cidade, temp, humidity, temp_min, temp_max, feels_like))
    }

    private getWheaterMessage(cidade, temp, humidity, temp_min, temp_max, feels_like) {
        return `Agora em *${cidade}* fazem *${temp}* ºC 
    Umidade relativa do ar em ${humidity}%
    
    Minima:             *${temp_min}* ºC
    Máxima:             *${temp_max}* ºC
    Sensação Térmica :  *${feels_like}* ºC`;
    }

}
