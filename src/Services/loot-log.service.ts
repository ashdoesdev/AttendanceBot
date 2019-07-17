import { TextChannel, Message, GuildMember } from "discord.js";
import { ItemScore, AwardedItem } from "../Models/item-score.model";
import { LootLogEmbed } from "../Embeds/loot-log.embed";
import { LootScore, LootScoreData, Signature, MinimalMember } from "../Models/loot-score.model";
import { MemberMatchHelper } from "../Helpers/member-match.helper";
import { LootScoreDataHelper } from "../Helpers/loot-score-data.helper";

export class LootLogService {
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();
    private _dataHelper: LootScoreDataHelper = new LootScoreDataHelper();

    public awardItem(message: Message, lootLogChannel: TextChannel, lootLogReadableChannel: TextChannel, item: ItemScore): void {
        let awardedItem = new AwardedItem();
        awardedItem.member = new MinimalMember();
        awardedItem.member.displayName = message.mentions.members.array()[0].displayName;
        awardedItem.member.id = message.mentions.members.array()[0].id;
        awardedItem.item = item;

        let lootScoreData = this._dataHelper.createLootScoreData(awardedItem, message);

        lootLogChannel.send(this.codeBlockify(JSON.stringify(lootScoreData)));
        lootLogReadableChannel.send(new LootLogEmbed(item, message.mentions.members.array()[0].displayName, message.member.displayName));
        message.channel.send(`Awarded ${message.mentions.members.array()[0].displayName} **${item.displayName}** (${item.score}).`);
    }

    public async getItemScores(itemScoresChannel: TextChannel): Promise<ItemScore[]> {
        let entries = await this.getItemScoreEntries(itemScoresChannel);
        let scores = new Array<ItemScore>();

        for (let entry of entries) {
            let array = this.convertStringPipesToArray(entry.content);
            let itemScore = new ItemScore();
            itemScore.displayName = array[0];
            itemScore.shorthand = array[1];
            itemScore.score = parseFloat(array[2]);

            let eligibleClasses = array[3];

            if (eligibleClasses) {
                itemScore.eligibleClasses = eligibleClasses.split(',').map((x) => x.trim());
            }

            scores.push(itemScore);
        }

        return scores;
    }

    public async getItemScoreEntries(itemScoresChannel: TextChannel): Promise<Message[]> {
        let entries = new Array<Message>();
        let lastId;

        while (true) {
            const options = { limit: 100 };
            const messages = await itemScoresChannel.fetchMessages(options);
            entries.push(...messages.array());
            lastId = messages.last().id;

            if (messages.size != 100) {
                break;
            }
        }

        return entries;
    }

    public async getEligibleMembers(item: ItemScore, lootLogChannel: TextChannel, presentMembers: GuildMember[]): Promise<string[]> {
        let lootLogMap = await this.createLootLogMap(lootLogChannel, presentMembers);
        let memberLootHistory = new Array<string>();
        let eligibleMembers = new Array<string>();

        lootLogMap.forEach((key, value) => {
            for (let looted of key) {
                if (looted.displayName === item.displayName) {
                    memberLootHistory.push(value.id);
                }
            }
        });

        presentMembers.forEach((member) => {
            if (!memberLootHistory.find((x) => x === member.id)) {
                let roles = new Array<string>();

                for (let role of member.roles.array()) {
                    roles.push(role.name.toLowerCase());
                }

                if (item.eligibleClasses) {
                    if (roles.filter((x) => item.eligibleClasses.includes(x)).length > 0) {
                        eligibleMembers.push(member.id);
                    }
                }

            }
        });

        return eligibleMembers;
    }
    
    public async getHasLooted(item: ItemScore, lootLogChannel: TextChannel, presentMembers: GuildMember[]): Promise<string[]> {
        let lootLogMap = await this.createLootLogMap(lootLogChannel, presentMembers);
        let memberLootHistory = new Array<string>();
        let hasLooted = new Array<string>();

        lootLogMap.forEach((key, value) => {
            for (let looted of key) {
                if (looted.displayName === item.displayName) {
                    memberLootHistory.push(value.id);
                }
            }
        });

        presentMembers.forEach((member) => {
            if (memberLootHistory.find((x) => x === member.id)) {
                hasLooted.push(member.id);
            }
        });

        return hasLooted;
    }

    public async createLootLogMap(lootLogChannel: TextChannel, members: GuildMember[]): Promise<Map<GuildMember, ItemScore[]>> {
        let messageEntries = await this.getMessages(lootLogChannel);
        let lootLogMap = new Map<GuildMember, ItemScore[]>();

        for (let entry of messageEntries) {
            let cleanString = entry.content.replace(/`/g, '');
            let lootScoreData: LootScoreData<AwardedItem> = JSON.parse(cleanString);
            let lootLogEntry: AwardedItem = lootScoreData.value;

            let member = this._memberMatcher.matchMemberFromId(members, lootLogEntry.member.id);
            let entries = lootLogMap.get(member);

            if (entries) {
                lootLogMap.set(member, entries.concat(lootLogEntry.item));
            } else {
                lootLogMap.set(member, [lootLogEntry.item]);
            }
        }

        return lootLogMap;
    }

    public async getMessages(textChannel: TextChannel): Promise<Message[]> {
        let entries = new Array<Message>();

        while (true) {
            const options = { limit: 100 };
            const messages = await textChannel.fetchMessages(options);
            entries.push(...messages.array());

            if (messages.size != 100) {
                break;
            }
        }

        return entries;
    }

    public async getLootHistory(member: GuildMember, lootLogChannel: TextChannel, members: GuildMember[]): Promise<ItemScore[]> {
        let lootLogMap = await this.createLootLogMap(lootLogChannel, members);
        return lootLogMap.get(member);
    }

    private convertStringPipesToArray(string: string): string[] {
        let array = string.split('|');
        let trimmedArray = array.map(s => s.trim());

        return trimmedArray;
    }

    private codeBlockify(string: string): string {
        return '```' + string + '```';
    }
}