
export const RADAR_PATH = "./radar"
const KEY_PATH = `${RADAR_PATH}/{key}`

export class RadarUtil {
    static getStateKey(key: string) {
        return KEY_PATH.replace("{key}", key);
    }
}