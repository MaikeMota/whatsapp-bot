import { Command } from "../command";

import { TheOfficeIntroCommand } from "./the-office-intro.command";
import { TheOfficeRandomEpCommand } from "./the-office-random-ep.command";
import { TheOfficeRandomQuoteCommand } from "./the-office-random-quota.command";

export class TheOfficeCommand extends Command {

    command: string = "/the-office";
    subCommands: Command[] = [
        new TheOfficeRandomEpCommand(this),
        new TheOfficeRandomQuoteCommand(this),
        new TheOfficeIntroCommand(this),
    ];
}