import { Message } from "whatsapp-web.js";

export async function extractContactId(msg: Message): Promise<string> {
    const contact = await msg.getContact();
    return contact?.id?._serialized.replace(/:[0-9]*/, "");
}