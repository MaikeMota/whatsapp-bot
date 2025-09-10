import { Client, GroupChat, Message } from "whatsapp-web.js";
import { Command } from "../command";


const { GEMINI_KEY, GEMINI_DEFAULT_MODEL, GEMINI_YOUTUBE_URL_REGEX, GEMINI_VIDEO_RESUMO_SYSTEM_INSTRUCTION } = process.env;

const YOUTUBE_URL_REGEX = new RegExp(GEMINI_YOUTUBE_URL_REGEX);

export class YoutubeVideoResumeCommand extends Command {
    command = '/resumo';
    alternativeCommands = []

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {

        let videoUrl;
        let model;
        let extraInstructions;

        const quotedMessage = await msg.getQuotedMessage();
        const hasQuotedMsg = !!quotedMessage;
        if (hasQuotedMsg) {
            videoUrl = quotedMessage.body.trim();
            model = argsArray[0] || GEMINI_DEFAULT_MODEL;
            extraInstructions = argsArray.slice(1).join(" ");
        }else {
            videoUrl = argsArray[0];
            model = argsArray[1] || GEMINI_DEFAULT_MODEL;
            extraInstructions = argsArray.slice(2).join(" ");
        }

        if (!videoUrl) {
            await msg.reply("Informe a url do video");
            return;
        }
        if (!videoUrl.match(YOUTUBE_URL_REGEX)) {
            await msg.reply("Url inválida, por favor, usar somente link do youtube para vídeos públicos.");
            return;
        }

        const videoId = videoUrl.match(YOUTUBE_URL_REGEX)[1];


        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const system_instruction = { 
            "parts": [
                {
                    "text": GEMINI_VIDEO_RESUMO_SYSTEM_INSTRUCTION
                }
            ]
        };

        const contents = [];
        const parts = [];
        contents.push({parts})
        if (extraInstructions) {
            parts.push({ text: extraInstructions });
        }
        parts.push({
            "file_data": {
                "file_uri": `https://youtu.be/${videoId}`
            }
        });

        const body = JSON.stringify({
            system_instruction,
            contents,
        });

        const resultMessage = await msg.reply("Processando...");

       await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
            method: "POST",
            headers: myHeaders,
            body
        }).then((response) => response.json())
        .then(async (response) => {
            if(response.error) { 
                throw new Error(response.error.message);
            }
            await resultMessage.edit(response.candidates[0].content.parts[0].text);
        })
        .catch((error) => { 
            console.error(error);
            resultMessage.edit("Erro ao processar o vídeo, tente novamente mais tarde.\nError: " + error.message);
        });

    }
}