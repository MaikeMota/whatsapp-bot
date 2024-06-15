import { StateSaver } from "../../utils/interfaces/state-save.interface";
import { JSONStateSaver } from "../../utils/json-state-saver";
import { Wallet } from "./wallet.interface";
import { WalletPosition } from "./wallet.position.interface";

interface CachedWallet {
    wallet: Wallet,
    lastUpdateTime: number
}

export class WalletService {

    private static readonly TICKER_PLACEHOLDER = '{ticker}';
    private static readonly WALLET_NOT_REGISTERED_YET = 'Você ainda não possui uma carteira registrada.';
    private static readonly TICKER_NOT_REGISTERED_YET = `Você não cadastrou a empresa com ticker ${WalletService.TICKER_PLACEHOLDER} na sua carteira anteriormente, por favor realize o cadastro antes de usar este comando.`;

    private stateSaver: StateSaver<Wallet> = new JSONStateSaver<Wallet>();

    private cache: { [key: string]: CachedWallet } = {};
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
        if (!this.cache[key]) {
            this.cache[key] = { wallet: {}, lastUpdateTime: 0 }
        }
        if (this.cache[key].lastUpdateTime < Date.now() - (1000 * 60)) {
            this.cache[key].wallet = await this.stateSaver.load(this.resolveKey(key));
            this.cache[key].lastUpdateTime = Date.now();
        }
        if (!this.cache[key] || Object.keys(this.cache[key].wallet).length == 0) {
            return Promise.reject(WalletService.WALLET_NOT_REGISTERED_YET);
        }
        return this.cache[key].wallet;
    }

    async updatePosition(key: string, updatedPosition: WalletPosition) {

        let actualPosition = await this.getPosition(key, updatedPosition.ticker).catch(e => undefined);
        const alreadyExists = !!actualPosition;

        let cachedWallet = this.cache[key];
        if (!cachedWallet) {
            cachedWallet = { wallet: {}, lastUpdateTime: 0 }
            this.cache[key] = cachedWallet
        }
        cachedWallet.wallet[updatedPosition.ticker] = updatedPosition;
        await this.saveState(key, cachedWallet.wallet)
        cachedWallet.lastUpdateTime = Date.now();
        return alreadyExists;
    }

    async removePosition(key: string, ticker: string) {
        let actualPosition = await this.getPosition(key, ticker).catch(e => undefined);
        const alreadyExists = !!actualPosition;

        if (!alreadyExists) {
            return Promise.reject(WalletService.TICKER_NOT_REGISTERED_YET.replace(WalletService.TICKER_PLACEHOLDER, ticker));
        }

        this.cache[key][ticker] = undefined;

        await this.saveState(key, this.cache[key].wallet);
    }

    private async saveState(key: string, state: Wallet) {
        await this.stateSaver.save(this.resolveKey(key), state);
    }

    private resolveKey(key: string) {
        return `./wallets/${key}`;
    }

}
