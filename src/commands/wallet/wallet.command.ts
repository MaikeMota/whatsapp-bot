import { Command } from "../command";
import { WalletAddCommand } from "./wallet.add.command";
import { WalletVerCommand } from "./wallet.ver.command";

export class WalletCommand extends Command {

    command: string = "/carteira";
    
    subCommands: Command[] = [
        new WalletVerCommand(this),
        new WalletAddCommand(this)
    ]; 

    get isV2(): boolean {
        return true;
    }
}