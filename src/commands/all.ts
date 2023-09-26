import { Client, GroupChat, Message } from "whatsapp-web.js";
import { userIsGroupAdmin } from "../utils/whatsapp.util";
import { Command } from "./command";

const ALL_COMMAND_INTERVAL_IN_MINUTES = parseInt((process.env.ALL_COMMAND_INTERVAL_IN_MINUTES || `5`))

const INTERVAL_BETWEEN_USES = ALL_COMMAND_INTERVAL_IN_MINUTES * 60 * 1000

const BANNED_USERS = process.env.ALL_COMMAND_BANNED_USERS.split(',').map(u => u.trim());

const lastUses = {}
const lastWarnings = {}

export class MentionAllCommand extends Command {
    command = '@all';
    alternativeCommands = ['@todos']

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {

        const contact = await msg.getContact();
        if (!chat.isGroup || BANNED_USERS.includes(contact.number)) {
            return;
        }
        const isUserAdmin = await userIsGroupAdmin(msg, chat)
        if (!isUserAdmin) {
            return
        }

        const key = `${chat.id}-${msg.author}`
        const now = Date.now();

        if (this.hadUsedRecently(key, now)) {
            if (this.hasBeenWarned(key, now)) {
                return;
            }
            this.setLastWarning(key, now);
            await msg.reply("Você não pode marcar todo mundo com tanta frequência!")
            return;
        }
        let text = "";
        let mentions = [];

        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);
            mentions.push(contact);
            text += ` @${participant.id.user}`;
        }
        this.setLastUsage(key, now);
        await chat.sendMessage(text, { mentions });

    }

    private setLastWarning(key: string, now: number) {
        lastWarnings[key] = now;
    }

    private setLastUsage(key: string, now: number) {
        lastUses[key] = now;
    }

    private hasBeenWarned(key: string, now: number) {
        const lastWarning = lastWarnings[key];
        return lastWarning && (now - lastWarning) < INTERVAL_BETWEEN_USES;
    }

    private hadUsedRecently(key: string, now: number) {
        const lastUse = lastUses[key];
        return lastUse && (now - lastUse) < INTERVAL_BETWEEN_USES;
    }
}