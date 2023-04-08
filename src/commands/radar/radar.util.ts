
const KEY_PATH = "./radar/{key}"

export class RadarUtil {
    static getStateKey(key: string) {
        return KEY_PATH.replace("{key}", key);
    }
}