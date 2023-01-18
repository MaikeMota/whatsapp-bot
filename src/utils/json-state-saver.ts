import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { resolve } from "path";

import { StateSaver } from "./interfaces/state-save.interface";

const { TEMP_FOLDER } = process.env;

export const tempFolder = resolve(process.cwd(), TEMP_FOLDER || 'src/data/tmp');

const FILE_ENCODING = 'utf-8';

export class JSONStateSaver<T> implements StateSaver<T> {

    constructor() {
        console.log(`[JSONStateSaver] Using ${tempFolder} as temp folder.`);
    }

    async save(key: string, state: T): Promise<void> {
        const filePath = this.resolveFilePath(key);
        writeFileSync(filePath, JSON.stringify(state), { encoding: FILE_ENCODING });
    }

    async load(key: string): Promise<T> {
        const filePath = this.resolveFilePath(key);
        if (existsSync(filePath)) {
            const json = readFileSync(filePath, { encoding: FILE_ENCODING });
            return JSON.parse(json) as T;
        }
    }

    private resolveFilePath(key: string) {
        return resolve(tempFolder, `${key}.json`);
    }
    remove(key: string): Promise<void> {
        const filePath = this.resolveFilePath(key);
        if (existsSync(filePath)) {
            const json = unlinkSync(filePath);
        }
        return;
    }
}


