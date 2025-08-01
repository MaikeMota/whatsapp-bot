import { Client, GroupChat, Message } from "whatsapp-web.js";
import { JSONStateSaver } from "../utils/json-state-saver";
import { bold, extractContactId, userIsGroupAdmin } from '../utils/whatsapp.util';
import { Command } from "./command";

const ALL_COMMAND_INTERVAL_IN_MINUTES = parseInt((process.env.ALL_COMMAND_INTERVAL_IN_MINUTES || `5`))

const INTERVAL_BETWEEN_USES = ALL_COMMAND_INTERVAL_IN_MINUTES * 60 * 1000

const lastUses = {}

interface AllMentionGroup {
    [chatId: string]: { [key: string]: { user: string, id: string }[]; }
}

export class MentionAllCommand extends Command {
    command = '@all';
    alternativeCommands = ['@todos', "/all", "/todos"]

    stateSaver = new JSONStateSaver<AllMentionGroup>();

    async handle(client: Client, chat: GroupChat, msg: Message, ...argsArray: string[]): Promise<void> {

        if (!chat.isGroup) {
            return;
        }

        const isFromGroupAdmin = await userIsGroupAdmin(msg, chat)

        const contactId = await extractContactId(msg);

        const [maybeSubcommand, ...subCommandArgs] = argsArray;

        let groupName = 'default';

        if (maybeSubcommand) {
            const [groupName, adtionalCommand, ...adtionalArgs] = subCommandArgs;
            let group = await this.getGroup(chat.id._serialized, groupName);
            const mentionedContacts = await msg.getMentions();
            switch (maybeSubcommand) {
                case 'add_to_group':
                case 'add': {
                    if (mentionedContacts.length === 0) {
                        await msg.react('👎');
                        await msg.reply(`Nenhum contato foi mencionado para ser adicionado ao grupo ${bold(groupName)} para o chat ${bold(chat.name)}`, contactId);
                        return
                    }
                    mentionedContacts.push(await msg.getContact());
                    for (let contact of mentionedContacts) {
                        if (!group.find(g => g.id === contact.id._serialized)) {
                            group.push({ user: contact.id.user, id: contact.id._serialized });
                        }
                    }
                    await this.saveGroup(chat.id._serialized, groupName, group);
                    await msg.reply(`Adicionado ${mentionedContacts.map(c => c.id.user).join(', ')} ao grupo ${bold(groupName)} para o chat ${bold(chat.name)}`, contactId);
                    await msg.react('👍');
                    return;
                }
                case 'remove_from_group':
                case 'remove': {
                    if (adtionalCommand === 'all') {
                        group = [];
                    } else {
                        if (mentionedContacts.length === 0) {
                            await msg.react('👎');
                            await msg.reply(`Nenhum contato foi mencionado para ser removido do grupo ${bold(groupName)} para o chat ${bold(chat.name)}`, contactId);
                            return
                        }
                        for (let contact of mentionedContacts) {
                            group = group.filter(g => g.id !== contact.id._serialized);
                        }
                    }
                    await this.saveGroup(chat.id._serialized, groupName, group);
                    await msg.react('👍');
                    await msg.reply(`Removido ${group.length === 0 ? 'todos' : mentionedContacts.map(c => c.id.user).join(', ')} do grupo ${bold(groupName)} para o chat ${bold(chat.name)}`, contactId);
                    return;
                }
                case 'list':
                case 'list_groups': {
                    const allRegisteredChats = await this.stateSaver.load('all_groups');
                    const allGroupsForChat = allRegisteredChats[chat.id._serialized];
                    if (!allGroupsForChat) {
                        await msg.react('👎');
                        await msg.reply(`Não foi encontrado nenhum grupo para o chat ${bold(chat.name)}`, contactId);
                        return
                    }
                    await msg.react('👍');
                    await msg.reply(`Os seguintes grupos foram encontrados para o chat ${bold(chat.name)}:\n\n${Object.keys(allGroupsForChat).map(name => bold(name)).join('\n')}`, contactId);
                    return;
                }
                case 'entrar':
                case 'join': {
                    const sender = await msg.getContact();
                    if(!group.find(g => g.id === sender.id._serialized)) {
                        group.push({ user: sender.id.user, id: sender.id._serialized });
                        await this.saveGroup(chat.id._serialized, groupName, group);
                        await msg.react('👍');
                        await msg.reply(`Você entrou na lista '${bold(groupName)}' para o chat '${bold(chat.name)}'`, contactId);
                        return;
                    }
                }
                case 'sair':
                case 'leave': {
                    const sender = await msg.getContact();
                    if(group.find(g => g.id === sender.id._serialized)) {
                        group = group.filter(g => g.id !== sender.id._serialized);
                        await this.saveGroup(chat.id._serialized, groupName, group);
                        await msg.react('👍');
                        await msg.reply(`Você Saiu da lista '${bold(groupName)}' para o chat '${bold(chat.name)}'`, contactId);
                        return;
                    }else {
                        await msg.reply(`Você não está na lista '${bold(groupName)}' para o chat '${bold(chat.name)}'`, contactId);
                        return;
                    }
                }
                case 'membros':
                case 'members': {
                    if(group.length > 0) {
                        await msg.react('👍');
                        await msg.reply(`Membros da lista '${bold(groupName)}' para o chat '${bold(chat.name)}'

* ${group.map(g => `${g.user}`).join('\n* ')}`, contactId);
                        return;
                    }else {
                        await msg.react('👎');
                        await msg.reply(`Nenhum membro na lista '${bold(groupName)}' para o chat '${bold(chat.name)}'`, contactId);
                        return;
                    }
                }
            }
        }

        let usersToMention = chat.participants.map(p => { return { user: p.id.user, id: p.id._serialized } });

        let usingNamedList = false;
        // at this point maybeSubcommand could be a group name
        if (maybeSubcommand) {
            groupName = maybeSubcommand;
            const group = await this.getGroup(chat.id._serialized, groupName);
            if (group.length === 0) {
                await msg.react('👎');
                await msg.reply(`Não foi encontrado um grupo com o nome ${bold(groupName)} para o chat ${bold(chat.name)}`, contactId);
                return;
            }
            usersToMention = group;
            usingNamedList = true;
        }

        const key = `${chat.id._serialized}-${msg.author}-${groupName}`;
        const now = Date.now();

        if (!usingNamedList && !msg.fromMe && !isFromGroupAdmin) {
            await msg.react('👎');
            await msg.reply("Somente administradores podem usar este comando.", contactId);
            console.log(`Usuário ${contactId} tentou usar o comando @all geral no grupo ${chat.name} porem não é um administrador.`);
            return;
        }

        if (!msg.fromMe && this.hadUsedRecently(key, now)) {
            await msg.react('👎');
            await msg.reply("Você não pode marcar todo mundo com tanta frequência!", contactId);
            return;
        }

        let mentions = [];
        for (let participant of usersToMention) {
            mentions.push(participant.id);
        }

        this.setLastUsage(key, now);

        const messageToReply = await msg.getQuotedMessage() || msg;

        await msg.react('👍');
        await messageToReply.reply("☝️", chat.id._serialized, { mentions });

    }

    private setLastUsage(key: string, now: number) {
        lastUses[key] = now;
    }

    private hadUsedRecently(key: string, now: number) {
        const lastUse = lastUses[key];
        if(!lastUse){ 
            return false
        }
        const usageDiff = now - lastUse
        console.log(`[@all] key: ${key}, lastUse: ${lastUse}, now: ${now}, usageDiff: ${usageDiff}`);
        return usageDiff < INTERVAL_BETWEEN_USES;
    }

    private async getGroup(chatId, groupName) {
        let allRegisteredGroups = await this.stateSaver.load('all_groups');
        if (!allRegisteredGroups) {
            allRegisteredGroups = {};
        }
        if (!allRegisteredGroups[chatId]) {
            allRegisteredGroups[chatId] = {};
        }
        if (!allRegisteredGroups[chatId][groupName]) {
            allRegisteredGroups[chatId][groupName] = [];
        }
        return allRegisteredGroups[chatId][groupName];
    }

    private async saveGroup(chatId, groupName, users) {
        let allRegisteredGroups = await this.stateSaver.load('all_groups');
        if (!allRegisteredGroups) {
            allRegisteredGroups = {};
        }
        if (!allRegisteredGroups[chatId]) {
            allRegisteredGroups[chatId] = {};
        }
        allRegisteredGroups[chatId][groupName] = users;
        await this.stateSaver.save('all_groups', allRegisteredGroups);
    }
}