
const API_KEYS = process.env.RANDOM_ORG_API_KEYS.split(',');


export class RandomService {

    
    private static currentKeyIndex = 0;

    static async getRandomNumbers(quantity: number, lowerLimit: number, uperLimit: number): Promise<number[]> {
        const headers = { 'content-type': 'application/json' }
        const payload = {
            "jsonrpc": "2.0",
            "method": "generateIntegers",
            "params": {
                "apiKey": API_KEYS[this.currentKeyIndex],
                "n": quantity * 3,
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
            const responseAsJson = await response.json()
            if(responseAsJson.error) {
                if(responseAsJson.error.code === 402) {
                    this.incrementKeyIndex();
                    return this.getRandomNumbers(quantity, lowerLimit, uperLimit);
                }
                console.log(`[RandomService] Failed to fetch random numbers. Error Code: ${responseAsJson.error.code} Message: ${responseAsJson.error.message}`);
                throw new Error(`Failed to fetch random numbers. Error [${responseAsJson.error.code}]: ` + responseAsJson.error.message);
            }
            return responseAsJson.result.random.data

        }catch(e) { 
            console.log(`[RandomService] Failed to fetch random numbers. Error: ${e}`);
            throw new Error('Failed to fetch random numbers. Error: ' + e.message);
        }
    }

    static incrementKeyIndex() {
        this.currentKeyIndex++;
        if(this.currentKeyIndex >= API_KEYS.length) {
            this.currentKeyIndex = 0;
        }
    }
}