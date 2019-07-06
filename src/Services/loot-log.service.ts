import { TextChannel, Message, GuildMember } from "discord.js";
import { ItemScore } from "../Models/item-score.model";
import { LootLogEmbed } from "../Embeds/loot-log.embed";
import { LootScore } from "../Models/loot-score.model";

export class LootLogService {
    public awardItem(message: Message, lootLogChannel: TextChannel, lootLogReadableChannel: TextChannel, item: ItemScore): void {
        let map = new Map<string, ItemScore>();
        map.set(message.mentions.members.array()[0].id, item);
        lootLogChannel.send(this.codeBlockify(JSON.stringify(Array.from(map.entries()))));
        lootLogReadableChannel.send(new LootLogEmbed(item, message.mentions.members.array()[0].displayName));
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
                itemScore.eligibleClasses = eligibleClasses.split(',');
            }

            for (let eligibleClass of itemScore.eligibleClasses) {
                eligibleClass.trim();
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
        let lootLogMap = await this.createLootLogMap(lootLogChannel);
        let memberLootHistory = new Array<string>();
        let eligibleMembers = new Array<string>();

        lootLogMap.forEach((key, value) => {
            if (key.displayName === item.displayName) {
                memberLootHistory.push(value);
            }
        });

        presentMembers.forEach((value) => {
            if (!memberLootHistory.find((member) => member === value.displayName)) {
                if 
            }
        });

    }

    public async createLootLogMap(lootLogChannel: TextChannel): Promise<Map<string, ItemScore>> {
        let entries = await this.getLootLog(lootLogChannel);
        let members = new Array<string>();
        let lootLogMap = new Map<string, ItemScore>();

        for (let entry of entries) {
            let cleanString = entry.content.replace(/`/g, '');
            let lootLogEntry: [string, ItemScore] = JSON.parse(cleanString);

            lootLogMap.set(lootLogEntry[0], lootLogEntry[1]);
        }

        return lootLogMap;
    }

    public async getLootLog(lootLogChannel: TextChannel): Promise<Message[]> {
        let entries = new Array<Message>();

        while (true) {
            const options = { limit: 100 };
            const messages = await lootLogChannel.fetchMessages(options);
            entries.push(...messages.array());

            if (messages.size != 100) {
                break;
            }
        }

        return entries;
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