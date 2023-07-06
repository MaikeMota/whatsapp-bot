import { Client, GroupChat, Message } from "whatsapp-web.js";
import { userIsGroupAdmin } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class GroupAdminRevokeCommand extends Command {
    command: string = "revoke";
    alternativeCommands: string[] = ["rebaixar"];

    usageDescription = "\t-> Remove os usuários mencionados dos administradores do grupo"

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {

        if (chat.isGroup) {
            if (await userIsGroupAdmin(msg, chat)) {
                let mentions = await msg.getMentions();
                mentions = mentions.filter(c => !c.isMe)
                if (mentions && mentions.length > 0) {
                    await chat.demoteParticipants(mentions.map(m => m.id._serialized));
                }
            }
        }
    }

    get isV2(): boolean {
        return true;
    }
}