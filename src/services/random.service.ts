
const API_KEY = process.env.RANDOM_ORG_API_KEY;

export class RandomService {

    static async getRandomNumbers(quantity: number, lowerLimit: number, uperLimit: number): Promise<number[]> {
        const headers = { 'content-type': 'application/json' }
        const payload = {
            "jsonrpc": "2.0",
            "method": "generateIntegers",
            "params": {
                "apiKey": API_KEY,
                "n": quantity,
                "min": lowerLimit,
                "max": uperLimit,
                "replacement": true,
                "base": 10
            },
            "id": 1
        }

        return await fetch('https://api.random.org/json-rpc/2/invoke', {
            body: JSON.stringify(payload),
            headers: headers,
            method: 'POST'
        })
            .then(r => r.json())
            .then(r => r.result.random.data as number[]);
    }
}