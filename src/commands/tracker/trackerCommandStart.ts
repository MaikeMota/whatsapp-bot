import { Chat, Client, Message } from "whatsapp-web.js";
import { extractContactId } from "../../utils/whatsapp.util";
import { Command } from "../command";

import { resolveKey, stateSaver } from "./tracker";
import { TrackerCommandSaveState } from "./trackerCommandSaveState.interface";

export class TrackerCommandStart extends Command {

    command = "start";
    alternativeCommands = ["começar", "iniciar"];

    usageDescription: string = "<chave> <descrição?> - Incia um tracking para a chave informada";

    async handle(_: Client, chat: Chat, msg: Message, ...argsArray: string[]): Promise<void> {
        const [key, ...descriptionAsArray] = argsArray;
        const stateKey = resolveKey(await extractContactId(msg), key);
        const status = await stateSaver.load(stateKey);
        if (status) {
            await msg.reply(`Já existe um tracking para a chave '${key}'`);
            return;
        }

        const state: TrackerCommandSaveState = {
            startDate: Date.now(),
            description: descriptionAsArray.join(' ')
        };

        stateSaver.save(stateKey, state);
        await msg.reply(`Tracking iniciado com sucesso!`);
    }
}
