import { Command } from "../command";
import { GroupAdminCloseCommand } from "./group-admin.close";
import { GroupAdminOpenCommand } from "./group-admin.open";
import { GroupAdminPromoteCommand } from "./group-admin.promote";
import { GroupAdminRevokeCommand } from "./group-admin.revoke";

export class GroupAdminCommand extends Command {

    command: string = "/admin";
    subCommands: Command[] = [
        new GroupAdminOpenCommand(this),
        new GroupAdminCloseCommand(this),
        new GroupAdminPromoteCommand(this),
        new GroupAdminRevokeCommand(this)
    ];
    get isV2(): boolean {
        return true;
    }
}