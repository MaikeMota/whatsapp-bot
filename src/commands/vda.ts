import { Chat, Client, Message } from "whatsapp-web.js";
import { getChannelStatistics } from "../services/youtube.service";
import { StateSaver } from "../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../utils/json-state-saver";
import { Command } from "./command";

const { getLatestVideo  } = require('../services/youtube.service');

const VIDEO_SUBCOMMANDS = ["video", "vídeo"];
const INSCRITOS_SUBCOMMANDS = ["inscritos"]
const LINKS_SUBCOMMANDS = ["links", "merch"]

const AVAILABLE_SUBCOMMANDS = [...VIDEO_SUBCOMMANDS, ...INSCRITOS_SUBCOMMANDS, ...LINKS_SUBCOMMANDS]

export class VDACommand extends Command {

    private statusSaver: StateSaver<Array<string>> = new JSONStateSaver<Array<string>>();

    command = '/vda';
    alternativeCommands = ['/vidacionista'];
    usageDescription = "";
//     usage = `
// */vda vídeo*
// */vidacionista vídeo*
//     _Exibe o último video publicado no canal Vida de Acionista._

// */vda inscritos*
// */vidacionista inscritos*
//     _Exibe a contagem de escritos no canal Vida de Acionista._

// */vda links*
// */vidacionista links*
// */vda merchs*
// */vidacionista merchs*
//     _Exibe os links de afiliado do canal._
// `;
    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [firstArg] = argsArray;
        return AVAILABLE_SUBCOMMANDS.includes(firstArg);
    }
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const [firstArg] = argsArray;
        if (VIDEO_SUBCOMMANDS.includes(firstArg)) {
            await this.handleVideoCommand(chat);
        } else if (INSCRITOS_SUBCOMMANDS.includes(firstArg)) {
            await this.handleInscritosCommand(msg);
        } else if (LINKS_SUBCOMMANDS.includes(firstArg)) {
            await this.handlePromotionalLinks(msg);
        }
    }

    private async handleInscritosCommand(msg) {
        const { subscriberCount } = await getChannelStatistics();
        await msg.reply(`Atualmente temos ${subscriberCount} inscritos.`).catch(console.log);
    }

    private async handleVideoCommand(chat) {
        const { title, messageMedia, videoUrl } = await getLatestVideo();
        await chat.sendMessage(messageMedia, {
            caption: `${title}\n\n${videoUrl}`
        });
    }

    private async handlePromotionalLinks(msg) {
        const links = await this.statusSaver.load("./vda/links");
        await msg.reply(links.join("\n"))
    }

}
