import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { Command } from "../command";

import { TrackerCommandSaveState } from "./trackerCommandSaveState.interface";
import { TrackerCommandStart } from "./trackerCommandStart";
import { TrackerCommandStop } from "./trackerCommandStop";


export const stateSaver: StateSaver<TrackerCommandSaveState> = new JSONStateSaver<TrackerCommandSaveState>();

export function resolveKey(id: string, key: string) {
    return `tracking-${id}-${key}`;
}

export class TrackerCommand extends Command {    
    command = '/tracker';
    alternativeCommands = [];
    subCommands = [new TrackerCommandStart(this), new TrackerCommandStop(this)];
    usageDescription?: string = "TODO";
}

