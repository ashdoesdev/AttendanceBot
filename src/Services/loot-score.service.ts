import { GuildMember, Message, TextChannel } from "discord.js";
import { MapSortHelper } from "../Helpers/map-sort.helper";
import { ItemScore, AwardedItem } from "../Models/item-score.model";
import { LootScoreData, MemberScore } from "../Models/loot-score.model";
import { MessagesHelper } from "../Helpers/messages.helper";
import { TimestampHelper } from "../Helpers/timestamp.helper";

export class LootScoreService {
    private _mapSort: MapSortHelper = new MapSortHelper();
    private _messages: MessagesHelper = new MessagesHelper();
    private _timestampHelper: TimestampHelper = new TimestampHelper();

    public totalRaids: number;

    public async getAttendanceMap(attendanceLogChannel: TextChannel): Promise<Map<string, number[]>> {
        let entries = await this._messages.getMessages(attendanceLogChannel);
        this.totalRaids = entries.length;

        let allEntries = new Map<string, number[]>();

        for (let entry of entries) {
            let endIndex = entry.content.length - 4;
            let cleanString = entry.content.replace(/`/g, '');

            if (cleanString.length > 0) {
                let lootScoreData: LootScoreData<[string, number][]> = JSON.parse(cleanString);
                for (let x of lootScoreData.value) {
                    if (!allEntries.has(x[0])) {
                        let array = new Array<number>();
                        array.push(x[1]);
                        allEntries.set(x[0], array);
                    } else {
                        let array = allEntries.get(x[0]);
                        array.push(x[1]);
                        allEntries.set(x[0], array);
                    }
                }
            }

        }

        return allEntries;
    }

    public async getSeniorityMap(seniorityLogChannel: TextChannel): Promise<Map<string, number>> {
        let entries = await this._messages.getMessages(seniorityLogChannel);
        let lastEntry = entries[0];

        let seniorityMap = new Map<string, number>();

        if (lastEntry) {
            let endIndex = lastEntry.content.length - 4;
            let cleanString = lastEntry.content.replace(/`/g, '');

            if (cleanString.length > 0) {
                let lootScoreData: LootScoreData<[string, number][]> = JSON.parse(cleanString);
                for (let x of lootScoreData.value) {
                    seniorityMap.set(x[0], x[1]);
                }
            }
        } 

        return seniorityMap;
    }

    public getAttendancePercentageMap(attendanceMap: Map<GuildMember, number[]>): Map<GuildMember, number> {
        let percentageMap = new Map<GuildMember, number>();

        for (let entry of attendanceMap) {
            let sum = entry[1].reduce(function (a, b) { return a + b; });
            let avg = sum / entry[1].length;
            percentageMap.set(entry[0], avg);
        }

        return percentageMap;
    }

    public createLootScoreMap(attendanceMap: Map<GuildMember, number[]>, attendancePercentageMap: Map<GuildMember, number>, seniorityMap: Map<GuildMember, number>, lootLogMap: Map<GuildMember, LootScoreData<AwardedItem>[]>): Map<GuildMember, MemberScore> {
        let lootScoreMap = new Map<GuildMember, MemberScore>();

        for (let entry of attendancePercentageMap) {
            let memberScore = lootScoreMap.get(entry[0]);

            if (!memberScore) {
                memberScore = new MemberScore();
            }

            memberScore.attendancePercentage = Math.ceil(entry[1]);
            lootScoreMap.set(entry[0], memberScore);
        }

        for (let entry of attendanceMap) {
            let memberScore = lootScoreMap.get(entry[0]);

            if (!memberScore) {
                memberScore = new MemberScore();
            }

            memberScore.attendanceTotal = entry[1].length;
            lootScoreMap.set(entry[0], memberScore);
        }

        let highestValue = 1;

        for (let entry of seniorityMap) {
            if (entry[1] > highestValue) {
                highestValue = entry[1];
            }
        }

        for (let entry of seniorityMap) {
            let memberScore = lootScoreMap.get(entry[0]);

            if (!memberScore) {
                memberScore = new MemberScore();
            }

            memberScore.seniorityPercentage = Math.round((entry[1] / highestValue) * 100);
            lootScoreMap.set(entry[0], memberScore);
        }

        for (let entry of lootLogMap) {
            let total = 0;
            let offspecTotal = 0;

            for (let awardLog of entry[1]) {
                if (awardLog) {
                    if (!awardLog.value.offspec) {
                        total += awardLog.value.item.score;
                    } else {
                        offspecTotal += awardLog.value.item.score;
                    }
                }
            }

            let memberScore = lootScoreMap.get(entry[0]);

            if (!memberScore) {
                memberScore = new MemberScore();
            }

            memberScore.itemScoreTotal = total;
            memberScore.itemScoreOffspecTotal = offspecTotal;
            memberScore.lastLootDate = new Date(entry[1][0].signature.timestamp).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' });
            lootScoreMap.set(entry[0], memberScore);
        }

        return lootScoreMap;
    }
}
