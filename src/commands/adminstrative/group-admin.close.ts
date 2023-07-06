import { Client, GroupChat, Message } from "whatsapp-web.js";
import { GROUP_ADMIN_UNLOCKER_RUNNER_NAME, GroupAdminUnlockerRunnerState } from "../../runners/group-admin/unlocker.runner";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { userIsGroupAdmin } from "../../utils/whatsapp.util";
import { Command } from "../command";

export class GroupAdminCloseCommand extends Command {

    command: string = "close";
    alternativeCommands: string[] = ["fechar"];

    usageDescription = "\t-> Fecha o grupo para somente administradores poderem enviar mensagens"

    stateSaver = new JSONStateSaver<GroupAdminUnlockerRunnerState>();

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {
        if (chat.isGroup) {
            if (await userIsGroupAdmin(msg, chat)) {
                chat.setMessagesAdminsOnly(true)
                if (argsArray.length > 0) {
                    const [time, unit = "m"] = argsArray;
                    await chat.sendMessage(`Grupo fechado para não-administradores por ${format(parseInt(time), unit as UnitType)}`);
                    let currentState = await this.stateSaver.load(GROUP_ADMIN_UNLOCKER_RUNNER_NAME);
                    const unlockTime = new Date().getTime() + parseInt(time) * (unit === "m" ? 60000 : 3600000);
                    if (currentState) {
                        const currentLock = currentState.toUnlock.find(toUnlock => toUnlock.groupId === chat.id._serialized)
                        if (!currentLock) {
                            currentState.toUnlock.push({
                                groupId: chat.id._serialized,
                                unlockTime
                            })
                        } else {
                            currentLock.unlockTime = unlockTime;
                        }
                    } else {
                        currentState = {
                            toUnlock: [{
                                groupId: chat.id._serialized,
                                unlockTime
                            }]
                        }
                    }
                    await this.stateSaver.save(GROUP_ADMIN_UNLOCKER_RUNNER_NAME, currentState);
                } else {
                    await chat.sendMessage("Grupo temporariamente fechado para não-administradores");
                }
            }
        }
    }

    get isV2(): boolean {
        return true;
    }
}

const UnitNames = {
    single: {
        "m": "minuto",
        "h": "hora"
    },
    plural: {
        "m": "minutos",
        "h": "horas"
    }
}

type UnitType = "m" | "h";

function format(time: number, unit: UnitType) {
    return `${time} ${time > 1 ? UnitNames.plural[unit] : UnitNames.single[unit]}`;

}