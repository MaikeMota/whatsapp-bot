import { WalletPosition } from "./wallet.position.interface";

export interface Wallet {
    [key: string]: WalletPosition;
}
