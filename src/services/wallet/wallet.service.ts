import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { Wallet } from "./wallet.interface";
import { WalletPosition } from "./wallet.position.interface";

export class WalletService {

    private static readonly TICKER_PLACEHOLDER = '{ticker}';
    private static readonly WALLET_NOT_REGISTERED_YET = 'Você ainda não possui uma carteira registrada.';
    private static readonly TICKER_NOT_REGISTERED_YET = `Você não cadastrou a empresa com ticker ${WalletService.TICKER_PLACEHOLDER} na sua carteira anteriormente, por favor realize o cadastro antes de usar este comando.`;

    private stateSaver: StateSaver<Wallet> = new JSONStateSaver<Wallet>();

    private cachedWallet: Wallet;
    private lastUpdateTime: number;

    async getPosition(key: string, ticker: string) {
        try {
            const wallet = await this.getWallet(key);
            const position = wallet[ticker];
            if (!position) {
                return Promise.reject(WalletService.TICKER_NOT_REGISTERED_YET.replace(WalletService.TICKER_PLACEHOLDER, ticker));
            }
            return position;
        } catch (exception) {
            return Promise.reject(exception);
        }
    }

    async getWallet(key: string): Promise<Wallet> {
        if(!this.cachedWallet || this.lastUpdateTime < Date.now() - (1000 * 60)) {
            this.cachedWallet = await this.stateSaver.load(this.resolveKey(key));
            this.lastUpdateTime = Date.now();
        }
        if (!this.cachedWallet) {
            return Promise.reject(WalletService.WALLET_NOT_REGISTERED_YET);
        }
        return this.cachedWallet;
    }

    async updatePosition(key: string, updatedPosition: WalletPosition) {

        let actualPosition = await this.getPosition(key, updatedPosition.ticker).catch(e => undefined);
        const alreadyExists = !!actualPosition;

        this.cachedWallet[updatedPosition.ticker] = updatedPosition;
        await this.saveState(key)
        return alreadyExists;
    }

    async removePosition(key: string, ticker: string) {
        let actualPosition = await this.getPosition(key, ticker).catch(e => undefined);
        const alreadyExists = !!actualPosition;

        if(!alreadyExists) {
            return Promise.reject(WalletService.TICKER_NOT_REGISTERED_YET.replace(WalletService.TICKER_PLACEHOLDER, ticker));
        }

        this.cachedWallet[ticker] = undefined;

        await this.saveState(key);
    }

    private async saveState(key: string) {
        await this.stateSaver.save(this.resolveKey(key), this.cachedWallet);
    }

    private resolveKey(key: string) {
        return `./wallets/${key}/wallet`;
    }

}
