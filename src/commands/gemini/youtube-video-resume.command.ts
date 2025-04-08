import { Client, GroupChat, Message } from "whatsapp-web.js";
import { Command } from "../command";


const YOUTUBE_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const { GEMINI_KEY, GEMINI_RESUMO_PROMPT } = process.env;

export class YoutubeVideoResumeCommand extends Command {
    command = '/resumo';
    alternativeCommands = []

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {

        let [url] = argsArray;

        const quotedMessage = await msg.getQuotedMessage();
        const hasQuotedMsg = !!quotedMessage;
        if (hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            const matchs = quotedMsg.body.match(YOUTUBE_URL_REGEX)
            url = matchs[0];
        }

        if (!url) {
            await msg.reply("Informe a url do video");
            return;
        }
        if (!url.match(YOUTUBE_URL_REGEX)) {
            await msg.reply("Url inválida, por favor, usar somente link do youtube para vídeos públicos.");
            return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const body = JSON.stringify({
            "contents": [
                {
                    "parts": [
                        {
                            "text": GEMINI_RESUMO_PROMPT
                        },
                        {
                            "file_data": {
                                "file_uri": url
                            }
                        }
                    ]
                }
            ]
        });

        const resultMessage = await msg.reply("Processando...");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
            method: "POST",
            headers: myHeaders,
            body
        }).then((response) => response.json())
        .catch((error) => console.error(error));

            await resultMessage.edit(response.candidates[0].content.parts[0].text);


    }
}