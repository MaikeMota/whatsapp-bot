import { Client, GroupChat, Message, MessageTypes } from "whatsapp-web.js";
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
        let inlineData;

        const quotedMessage = await msg.getQuotedMessage();
        const hasQuotedMsg = !!quotedMessage;
        if (hasQuotedMsg) {

            model = argsArray[0] || GEMINI_DEFAULT_MODEL;
            extraInstructions = argsArray.slice(1).join(" ");

            if(quotedMessage.type === MessageTypes.TEXT){
                videoUrl = quotedMessage.body.trim();
            } else if (quotedMessage.type === MessageTypes.VIDEO) {
                const media = await quotedMessage.downloadMedia();
                if (media) {
                    if (!media.mimetype.startsWith("video/")) {
                        await msg.reply("Por favor, envie um vídeo ou link do youtube.");
                    }
                    inlineData = { 
                        mimeType: media.mimetype, 
                        data: media.data,
                        size: media.filesize
                    };
                }
                await msg.reply("Não foi possível realizar o download do vídeo.")
                return;
            }
         } else {
            videoUrl = argsArray[0];
            model = argsArray[1] || GEMINI_DEFAULT_MODEL;
            extraInstructions = argsArray.slice(2).join(" ");
        }

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

        if(inlineData) {
            if(inlineData.size && inlineData.size >= 2e+7) { 
                await msg.reply("Vídeo muito grande, por favor envie um vídeo menor que 20MB ou link do youtube.");
            }
            parts.push({
                "inline_data": {
                    "mime_type": inlineData.mimeType,
                    "data": inlineData.data,
                }
            });
        } else {
            if (!videoUrl) {
                await msg.reply("Informe a url do video");
                return;
            }
            if (!videoUrl.match(YOUTUBE_URL_REGEX)) {
                await msg.reply("Url inválida, por favor, usar somente link do youtube para vídeos públicos.");
                return;
            }

            const videoId = videoUrl.match(YOUTUBE_URL_REGEX)[1];
            parts.push({
                "file_data": {
                    "file_uri": `https://youtu.be/${videoId}`
                }
            });
        }

        contents.push({parts});
        
        if (extraInstructions) {
            parts.push({ text: extraInstructions });
        }
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