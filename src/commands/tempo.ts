import { Chat, Client, Message } from "whatsapp-web.js";
import { Command } from "./command.interface";

const { getWheater } = require('../services/wheater.service');

export class TempoCommand implements Command {
    command = '/tempo';
    alternativeCommands = [];
    usage = `*/tempo nome da sua cidade
    _Retorna dados sobre o tempo na cidade digitada_`;
    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        return argsArray.length > 0
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        let cidade = argsArray.length > 1 ? argsArray.join(' ') : argsArray[0];
        const wheaterInfo = await getWheater(cidade);

        if (!wheaterInfo) {
            await msg.reply(`Não consegui encontrar detalhes do tempo para a cidade de *${cidade}*, tente digitar o nome completo, sem abreviações.`);
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
