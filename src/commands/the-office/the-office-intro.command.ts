import { Client, GroupChat, Message, MessageMedia } from "whatsapp-web.js";

import { Command } from "../command";



export class TheOfficeIntroCommand extends Command {
    command: string = "intro";
    alternativeCommands: string[] = [];


    usageDescription = "\t-> Retorna a intro do The Office."

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {
        const audio = await MessageMedia.fromUrl("https://ia800900.us.archive.org/27/items/tvtunes_632/The%20Office.mp3")
        await msg.reply("", chat.id._serialized, {
            media: audio
        });
    }
}