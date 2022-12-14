/**
 * Generates a Random number between the min and max (inclusive)
 * @param {number} min 
 * @param {number} max 
 * @returns {number} A Random number between the min and max (inclusive)
 */
export function randomIntFromInterval(min: number, max: number): number { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}