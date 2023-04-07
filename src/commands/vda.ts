import { Chat, Client, Message } from "whatsapp-web.js";
import { getChannelStatistics } from "../services/youtube.service";
import { Command } from "./command";

const { getLatestVideo  } = require('../services/youtube.service');

const VIDEO_SUBCOMMANDS = ["video", "vídeo"];
const INSCRITOS_SUBCOMMANDS = ["inscritos"]
const LINKS_SUBCOMMANDS = ["links", "merch"]

const AVAILABLE_SUBCOMMANDS = [...VIDEO_SUBCOMMANDS, ...INSCRITOS_SUBCOMMANDS, ...LINKS_SUBCOMMANDS]

export class VDACommand extends Command {
    command = '/vda';
    alternativeCommands = ['/vidacionista'];
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
        await msg.reply(`🐊 Assine a plataforma AGF+ com 30% de desconto: https://bit.ly/3nJHQUl
    
    Considere comprar um dos livros recomendados pelos links abaixo:
    
    📚 O rei dos dividendos: A saga do filho de imigrantes pobres que se tornou o maior investidor pessoa física da bolsa de valores brasileira: https://amzn.to/3EUcWm4
    📚 A psicologia financeira: lições atemporais sobre fortuna, ganância e felicidade - Morgan Housel: https://amzn.to/3c2HjdT (livro físico) ou https://amzn.to/3NTn3Z6 (ebook)
    📚 O mercado de ações em 25 episódios - Paulo Portinho: https://amzn.to/3PhdZyN
    📚 Faça Fortuna com Ações, Antes que seja Tarde - Décio Bazin: https://amzn.to/3OhjPPq
    📚 O Investidor em Ações de Dividendos - Orleans Martins: https://amzn.to/3AYUN4F
    📚 O Mais Importante para o Investidor - Howard Marks: https://amzn.to/3PCniJz
    📚 O jeito Warren Buffett de investir - Robert G. Hagstrom: https://amzn.to/3zdugzo
    📚 A bola de neve: Warren Buffett e o negócio da vida - Alice Schroeder: https://amzn.to/3Oi95Aj
    📚 O investidor de bom senso - John C. Bogle: https://amzn.to/3Pk8zDo
    📚 Investindo em Ações no Longo Prazo - Jeremy Siegel: https://amzn.to/3ob9mdJ
    📚 O investidor inteligente - Benjamin Graham: https://amzn.to/3oj8sMd
    📚 Os segredos da mente milionária - T. Harv Eker: https://amzn.to/3BgpPp1
    📚 Pai Rico, Pai Pobre - Robert T. Kiyosaki: https://amzn.to/3B1PH7W
    `)
    }

}
