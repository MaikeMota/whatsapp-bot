import { Client, GroupChat, Message, MessageMedia } from "whatsapp-web.js";
import { Command } from "../command";

import pokedex from '../../data/pokedex.json';
import { bold } from "../../utils/whatsapp.util";
import { PokedexInfo } from "./pokedex.info.interface";

export class PokedexCommand extends Command {
    command = '/pokedex';
    alternativeCommands = []

    pokedex: PokedexInfo[] = pokedex as PokedexInfo[]

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {


        const [id] = argsArray;

        const pokemon = this.pokedex.find(p => parseInt(p.id) === parseInt(id));

        if (!pokemon) {
            await msg.reply(`Pokémon com id ${id} não encontrado`);
            return;
        }


        const media = await MessageMedia.fromUrl(pokemon.image);


        await msg.reply(`#${pokemon.id} - ${bold(pokemon.name)}
*Tipo*: ${pokemon.type.split(' ').join(', ')}
*Total*: ${pokemon.total}
*HP*: ${pokemon.hp}
*Ataque*: ${pokemon.attack}
*Defesa*: ${pokemon.defense}
*Ataque Especial*: ${pokemon.spAttack}
*Defesa Especial*: ${pokemon.spDefense}
*Velocidade*: ${pokemon.speed}
`, chat.id._serialized, {
            media: media
        });
    }

    get isV2() {
        return true;
    }
}