import { Client, GroupChat, Message } from "whatsapp-web.js";
import { userIsGroupAdmin } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class GroupAdminOpenCommand extends Command {
    command: string = "open";
    alternativeCommands: string[] = ["abrir"];

    usageDescription = "\t-> Fecha o grupo para somente administradores poderem enviar mensagens"

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (chat.isGroup) {
            if (await userIsGroupAdmin(msg, chat)) {
                chat.setMessagesAdminsOnly(false)
                await chat.sendMessage("Grupo reaberto!");
            }
        }
    }

    get isV2(): boolean {
        return true;
    }
}