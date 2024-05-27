import { Client, GroupChat, Message, MessageMedia } from "whatsapp-web.js";
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
        let media: MessageMedia;
        try { 
            const catApiResponse = await fetch('https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg&order=RANDOM&limit=1&category_ids=4&format=json').then(r => r.json());
            const media = await MessageMedia.fromUrl(catApiResponse[0].url);
        }catch(exception) {
            console.error("Erro ao buscar imagem de gato.\n" + exception)
        }

        const piada = getRandomElement(this.piadas);
        msg.reply(`${bold(piada.pergunta)}

${piada.resposta}

${getRandomElement(["😄", "😊", "😃", "😁", "😆", "😀", "🤡", "🤣", "😅", "🙃", "😶‍🌫️", "🐦", "🤪", "😜", "😝", "😛", "😌", "🤓", "🥳", "🥸"])}`, chat.id._serialized, {
            media: media
        });

    }
}