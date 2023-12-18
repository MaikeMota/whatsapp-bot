import { GroupChat, Message } from "whatsapp-web.js";

export async function extractContactId(msg: Message): Promise<string> {
    const contact = await msg.getContact();
    return contact?.id?._serialized.replace(/:[0-9]*/, "");
}

export function isId(possibleId: string): boolean {
    return possibleId.indexOf("@") >= 0;
}

export async function userIsGroupAdmin(originalMessage: Message, chat: GroupChat) {
    const senderId = await extractContactId(originalMessage);
    return chat.participants.find(p => p.id._serialized === senderId)?.isAdmin;
}

export function bold(text: string): string {
    return `*${text}*`;
}

export function italic(text: string): string {
    return `_${text}_`;
}

export function striketrough(text: string): string {
    return `~${text}~`;
}

export function monospace(text: string): string {
    return `\`\`\`${text}\`\`\``;
}

export function tabs(desiredTabs: number): string {
    return '\t'.repeat(desiredTabs);
}