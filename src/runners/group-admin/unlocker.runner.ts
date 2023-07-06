import { Client, GroupChat } from "whatsapp-web.js";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { Runner } from "../interfaces/runner.interface";


export const GROUP_ADMIN_UNLOCKER_RUNNER_NAME = "GroupAdminUnlockerRunner";


export class GroupAdminUnlockerRunner implements Runner {

    runnerName: string = GROUP_ADMIN_UNLOCKER_RUNNER_NAME;
    runEveryNMinutes: number = 1;

    stateSaver = new JSONStateSaver<GroupAdminUnlockerRunnerState>();

    async run(client: Client): Promise<void> {
        const state = await this.stateSaver.load(this.runnerName);
        const now = new Date().getTime();
        if (state) {
            for (const toUnlock of state.toUnlock) {
                if (toUnlock.unlockTime < now) {
                    const gChat = await client.getChatById(toUnlock.groupId) as GroupChat;
                    await gChat.setMessagesAdminsOnly(false);
                    await gChat.sendMessage("Grupo reaberto ;)")
                }
            }
            state.toUnlock = state.toUnlock.filter(toUnlock => toUnlock.unlockTime > now);
            this.stateSaver.save(this.runnerName, state);
        }

    }

    shutdown(): Promise<void> {
        return Promise.resolve();
    }
}

export interface GroupAdminUnlockerRunnerState {
    toUnlock: {
        groupId: string;
        unlockTime: number;
    }[]
}