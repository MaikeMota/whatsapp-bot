import { Chat, Client, Message } from "whatsapp-web.js";

export abstract class Command {

    constructor(parentCommand?: Command) {
        this.parentCommand = parentCommand
    }

    abstract command: string;

    alternativeCommands: string[] = [];
    subCommands?: Command[] = [];
    parentCommand?: Command;
    usageDescription?: string;

    async isValid(chat: Chat, msg: Message, ...argsArray: string[]): Promise<boolean> {
        const [command] = argsArray;
        if (this.hasSubCommands) {
            const subCommand = this.subCommands.find(subCommand => subCommand.command === command || subCommand.alternativeCommands.includes(command))
            if (subCommand) {
                return subCommand.isValid(chat, msg, ...argsArray);
            }
            return false;
        }
        return (this.command === command || this.alternativeCommands.includes(command));
    }
    
    async handle(client: Client, chat: Chat, msg: Message, ...[command, ...argsArray]: string[]): Promise<void> {
        if(this.hasSubCommands){ 
            const subCommand = this.subCommands.find(subCommand => subCommand.command === command || subCommand.alternativeCommands.includes(command))
            if (subCommand) {
                await subCommand.handle(client, chat, msg, ...argsArray);
            }
        }        
    }

    get isSubCommand(): boolean {
        return !!this.parentCommand;
    }

    get hasSubCommands(): boolean {
        return this.subCommands && this.subCommands.length > 0;
    };

    get usage(): string {
        if (this.isSubCommand) {
            return `${this.command} ${this.usageDescription}`;
        }
        return this.subCommands?.map(subCommand => `${this.command} ${subCommand.usage}`).join('\n');
    }

}
