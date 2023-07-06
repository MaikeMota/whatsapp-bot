import { Client, GroupChat, Message } from "whatsapp-web.js";
import { userIsGroupAdmin } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class GroupAdminPromoteCommand extends Command {
    command: string = "promote";
    alternativeCommands: string[] = ["promover"];

    usageDescription = "\t-> Promove os usuários mencionados a administrador do grupo"

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (chat.isGroup) {
            if (await userIsGroupAdmin(msg, chat)) {
                const mentions = await msg.getMentions();
                if (mentions && mentions.length > 0) {
                    await chat.promoteParticipants(mentions.map(m => m.id._serialized));
                }
            }
        }
    }

    get isV2(): boolean {
        return true;
    }
}

