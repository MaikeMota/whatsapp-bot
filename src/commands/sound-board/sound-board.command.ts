/*

*/

import { Command } from "../command";
import { SoundBoardAddCommand } from "./sound-board.adicionar.command";
import { SoundBoardListCommand } from "./sound-board.list.command";
import { SoundBoardPlayCommand } from "./sound-board.play.command";

export class SoundBoardCommand extends Command {
    command: string = "/sound";
    alternativeCommands = ["/sound-board", "/soundboard"];
    subCommands: Command[] = [
        new SoundBoardAddCommand(this),
        new SoundBoardPlayCommand(this),
        new SoundBoardListCommand(this),
    ];

    get isV2(): boolean {
        return true;
    }
}