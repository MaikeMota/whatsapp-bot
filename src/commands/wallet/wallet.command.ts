import { Command } from "../command";
import { WalletAddCommand } from "./wallet.add.command";
import { WalletAddEarningCommand } from "./wallet.add.earning.command";
import { WalletBuyCommand } from "./wallet.buy.command";
import { WalletRemoveCommand } from "./wallet.remove.command";
import { WalletSetDPSProjectiveCommand } from "./wallet.set.dps.projective.command";
import { WalletSimulateInvestimentCommand } from "./wallet.simulate.investiment.command";
import { WalletVerCommand } from "./wallet.ver.command";

export class WalletCommand extends Command {

    command: string = "/carteira";
    
    subCommands: Command[] = [
        new WalletVerCommand(this),
        new WalletAddCommand(this),
        new WalletBuyCommand(this),
        new WalletAddEarningCommand(this),
        new WalletSetDPSProjectiveCommand(this),
        new WalletSimulateInvestimentCommand(this),
        new WalletRemoveCommand(this)
    ];
}