import { Chat, Client, Message } from "whatsapp-web.js";
import { formatString } from "../utils/string.utils";
import { getRandomElement } from "../utils/util";
import { Command } from "./command";

const { getWheater } = require('../services/wheater.service');

enum DaysOfWeek {
    "Domingo" = 0,
    "Segunda" = 1,
    "Terça" = 2,
    "Quarta" = 3,
    "Quinta" = 4,
    "Sexta" = 5,
    "Sabado" = 6
}

function getDayFromIndex(index) {
    for (const [key, value] of Object.entries(DaysOfWeek)) {
        if (value === index) {
            return key
        }
    }

    return;
}

const NOT_THE_DAY = ["Hoje não tem burro! É de Quinta!", "Hmmmmmmm, não, hoje ainda é {}.", "Claro que não, todo mundo sabe que de {} não tem.", "Só quinta cara!", "Só quinta, se não chover", "Reza a lenda que se tiver sol na quinta tem",
    "Deveria ter na quinta, mas ai mudou pra quarta pro Danilo ir ver o padre, mas ai voltou pra quinta, mas só tem se não chover 😶‍🌫️"
];
const ALMOST_THERE = ["Calma, estamos quase lá, amanhã tem... se não chover XD", "Amanhã jovem...", "Talvez amanhã, se não chover", `Amanhã com toda certeza!
    
    
    


A menos que chova né 😶‍🌫️...`,
"Antes não tinha, ai passou a ter, mas agora parece que não tem mais, volte na quinta.",];

const TODAY_IS_THE_DAY = ["Hoje tem!", "Mas claro!", "só colar", "Buteco tá aberto já!"];
const TODAY_IS_THE_DAY_BUT = ["Era pra ter, mas tá com cara de chuva...", "Veremos se não vai choover...", "Tem, mas se chover....",
"Parece que o tempo vai fechar, melhor adiarmos pra um dia mais tranquilo...",
"Vi a previsão aqui e vai chover. Vamos remarcar...",
"Com essa chuva toda, acho melhor deixarmos pra outro dia, né?",
"Olhei o tempo e vai chover, melhor deixar pra outro dia.",
"A previsão é de chuva. Que tal a gente combinar em um dia mais seco?"
]

export class HojeTemCommand extends Command {
    command = '/hoje-tem?';
    alternativeCommands: string[] = ["/hoje-tem?", "/hoje-tem", "hoje-tem?", "hoje-tem", "hojetem", "/hojetem"];

    usageDescription = ''

    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (!["120363043327600212@g.us", "554399867608@c.us"].includes(chat.id._serialized)) {
            return;
        }
        const now = new Date();
        
        let message = "";
        
        switch (now.getDay()) {
            case DaysOfWeek.Sexta:
                message = "Cara, teve ontem! tá viajando?"
                break;
            case DaysOfWeek.Sabado:
            case DaysOfWeek.Domingo:
            case DaysOfWeek.Segunda:
            case DaysOfWeek.Terça:
                message = formatString(getRandomElement(NOT_THE_DAY), getDayFromIndex(now.getDay()))
                break;
            case DaysOfWeek.Quarta:
                message = formatString(getRandomElement(ALMOST_THERE), getDayFromIndex(now.getDay()))
                break;
            case DaysOfWeek.Quinta:
                const cidade = "londrina";
                const wheaterInfo = await getWheater(cidade);
                const { hasChanceToRain } = wheaterInfo;
                message = getRandomElement(hasChanceToRain ? TODAY_IS_THE_DAY_BUT : TODAY_IS_THE_DAY)
                break;
        }

        await msg.reply(message);

    }

    private getWheaterMessage(cidade, temp, humidity, temp_min, temp_max, feels_like) {
        return `Agora em *${cidade}* fazem *${temp}* ºC 
    Umidade relativa do ar em ${humidity}%
    
    Minima:             *${temp_min}* ºC
    Máxima:             *${temp_max}* ºC
    Sensação Térmica :  *${feels_like}* ºC`;
    }

}
