import { TextChannel, Message, GuildMember } from "discord.js";
import { ItemScore, AwardedItem } from "../Models/item-score.model";
import { LootLogEmbed } from "../Embeds/loot-log.embed";
import { LootScore, LootScoreData, Signature, MinimalMember } from "../Models/loot-score.model";
import { MemberMatchHelper } from "../Helpers/member-match.helper";
import { LootScoreDataHelper } from "../Helpers/loot-score-data.helper";
import { MessagesHelper } from "../Helpers/messages.helper";

export class LootLogService {
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();
    private _dataHelper: LootScoreDataHelper = new LootScoreDataHelper();
    private _messages: MessagesHelper = new MessagesHelper();

    public awardItem(message: Message, lootLogChannel: TextChannel, lootLogReadableChannel: TextChannel, item: ItemScore, member: GuildMember, offspec = false, noValue = false, flags: string[]): void {
        let awardedItem = new AwardedItem();
        awardedItem.member = new MinimalMember();
        awardedItem.member.displayName = member.displayName;
        awardedItem.member.id = member.id;
        awardedItem.item = item;
        awardedItem.offspec = offspec;
        awardedItem.flags = flags;

        if (noValue) {
            awardedItem.item.score = 0;
        }

        let lootScoreData = this._dataHelper.createLootScoreData(awardedItem, message);

        lootLogChannel.send(this.codeBlockify(JSON.stringify(lootScoreData)));
        lootLogReadableChannel.send(new LootLogEmbed(lootScoreData));

        let extras = '';

        if (offspec) {
            extras = ' (offspec)';
        }

        if (flags.length > 0) {
            extras = ` (${flags[0]})`;
        }

        message.channel.send(`Awarded ${member.displayName} **${item.displayName}**${extras}.`);
    }

    public async getItemScores(itemScoresChannel: TextChannel): Promise<ItemScore[]> {
        let entries = await this._messages.getMessages(itemScoresChannel);
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

    public async getEligibleMembers(item: ItemScore, lootLogChannel: TextChannel, presentMembers: GuildMember[]): Promise<string[]> {
        let lootLogMap = await this.createLootLogMap(lootLogChannel, presentMembers);
        let memberLootHistory = new Array<string>();
        let eligibleMembers = new Array<string>();

        lootLogMap.forEach((key, value) => {
            for (let looted of key) {
                if (looted.value.item) {
                    if (looted.value.item.displayName === item.displayName) {
                        memberLootHistory.push(value.id);
                    }
                }
            }
        });

        presentMembers.forEach((member) => {
            if (!memberLootHistory.find((x) => x === member.id)) {
                let roles = new Array<string>();

                for (let role of member.roles.array()) {
                    roles.push(role.name.toLowerCase());
                }

                if (item) {
                    if (item.eligibleClasses) {
                        if (roles.filter((x) => item.eligibleClasses.includes(x)).length > 0) {
                            eligibleMembers.push(member.id);
                        }
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
                if (looted.value.item) {
                    if (looted.value.item.displayName === item.displayName) {
                        memberLootHistory.push(value.id);
                    }
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

    public async createLootLogMap(lootLogChannel: TextChannel, members: GuildMember[]): Promise<Map<GuildMember, LootScoreData<AwardedItem>[]>> {
        let messageEntries = await this._messages.getMessages(lootLogChannel);
        let lootLogMap = new Map<GuildMember, LootScoreData<AwardedItem>[]>();

        for (let entry of messageEntries) {
            let cleanString = entry.content.replace(/`/g, '');
            let lootScoreData: LootScoreData<AwardedItem> = JSON.parse(cleanString);
            let lootLogEntry: AwardedItem = lootScoreData.value;
            let member;
            let entries;
            if (lootLogEntry.member.id) {
                member = this._memberMatcher.matchMemberFromId(members, lootLogEntry.member.id);
                entries = lootLogMap.get(member);
            }

            if (entries) {
                lootLogMap.set(member, entries.concat(lootScoreData));
            } else {
                lootLogMap.set(member, [lootScoreData]);
            }
        }

        return lootLogMap;
    }

    public async getLootHistory(member: GuildMember, lootLogChannel: TextChannel, members: GuildMember[]): Promise<LootScoreData<AwardedItem>[]> {
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