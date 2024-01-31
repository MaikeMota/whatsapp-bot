import { Command } from "../command";
import { StravaListCommand } from "./strava.list.command";
import { StravaRegisterCommand } from "./strava.register.command";

export class StravaCommand extends Command {

    command: string = "/strava";
    subCommands: Command[] = [
        new StravaRegisterCommand(this),
        new StravaListCommand(this)
    ]
}