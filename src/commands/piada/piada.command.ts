import { Client, GroupChat, Message } from "whatsapp-web.js";
import { Command } from "../command";


import piadas from '../../data/piadas.json';
import { getRandomElement } from "../../utils/util";
import { bold } from "../../utils/whatsapp.util";
import { Piada } from "./piada.interface";

export class PiadaCommand extends Command {
    command = '/piada';

    alternativeCommands = []


    piadas: Piada[] = piadas as Piada[]

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {

        const piada = getRandomElement(this.piadas);
        msg.reply(`${bold(piada.pergunta)}

${piada.resposta}

${getRandomElement(["😄", "😊", "😃", "😁", "😆", "😀", "🤡", "🤣", "😅", "🙃", "😶‍🌫️", "🐦", "🤪", "😜", "😝", "😛", "😌", "🤓", "🥳","🥸"])}
`

        );
    }
}