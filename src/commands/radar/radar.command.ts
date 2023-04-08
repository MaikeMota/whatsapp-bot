/*

/radar ver -> exibe o radar daquela pessoa
/radar adicionar <ticker> -> adiciona um ticker ao radar
/radar remover <ticker> -> remove um ticker ao radar

*/

import { Command } from "../command";

import { RadarAdicionarCommand } from "./radar.adicionar.command";
import { RadarBESSTCommand } from "./radar.besst.command";
import { RadarRemoverCommand } from "./radar.remover.command";
import { RadarVerCommand } from "./radar.ver.command";

export class RadarCommand extends Command {
    command: string = "/radar";
    subCommands: Command[] = [
        new RadarBESSTCommand(this),
        new RadarVerCommand(this),
        new RadarAdicionarCommand(this),
        new RadarRemoverCommand(this),
    ]; 

    get isV2(): boolean {
        return true;
    }
}