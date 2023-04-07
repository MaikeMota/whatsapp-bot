import * as fs from 'fs';
import * as path from 'path';

import { Chat, Client, Message } from 'whatsapp-web.js';
import { Command } from './command';

import { Deepgram } from '@deepgram/sdk';


const deepgram = new Deepgram(process.env.DEEPGRAM_APY);

export class TranscreverCommand extends Command {
    command: string = '/transcrever';
    
    usageDescription = '<audio> - Transcreve o áudio para texto';
    
    async handle(client: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (!msg.fromMe) {
            return
        }
        if(!msg.hasQuotedMsg) { 
            return;
        }
        const originalMessage = await msg.getQuotedMessage();
        if (!['ptt', 'audio'].includes(originalMessage.type.toString())) {
            return
        }
        const media = await originalMessage.downloadMedia();
        const fileContents = Buffer.from(media.data, 'base64');
        const filePath = path.resolve('./', `./${Date.now()}.mp3`);
        fs.writeFileSync(filePath, fileContents);

        const result = await deepgram.transcription.preRecorded(
            { buffer: fs.readFileSync(filePath), mimetype: "audio/mp3" },
            {
                language: 'pt-BR',
                punctuate: true, 
                numerals:true,
                utterances: true,
                times: false
            },
        )

        await msg.reply(result.results.channels[0].alternatives[0].transcript);
        fs.unlink(filePath, (err) => { if (err) console.error(err) });
    }
}