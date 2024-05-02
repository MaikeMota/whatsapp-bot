
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

        try { 
            const response = await fetch('https://api.random.org/json-rpc/2/invoke', {
                body: JSON.stringify(payload),
                headers: headers,
                method: 'POST'
            })

            if(response.status !== 200) {
                console.log(`[RandomService] Failed to fetch random numbers. Status: ${response.status}`);
                throw new Error('Failed to fetch random numbers');
            }
            return (await response.json()).result.random.data

        }catch(e) { 
            console.log(`[RandomService] Failed to fetch random numbers. Error: ${e}`);
            throw new Error('Failed to fetch random numbers. Error: ' + e.message);
        }
    }
}