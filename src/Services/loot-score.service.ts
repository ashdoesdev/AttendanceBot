import { GuildMember, TextChannel, Message } from "discord.js";
import { MemberScore, LootScoreData } from "../Models/loot-score.model";
import { ItemScore } from "../Models/item-score.model";
import { MemberMatchHelper } from "../Helpers/member-match.helper";
import { MapSortHelper } from "../Helpers/map-sort.helper";

export class LootScoreService {
    private _mapSort: MapSortHelper = new MapSortHelper();

    public totalRaids: number;

    public async getAttendanceEntries(attendanceLogChannel: TextChannel): Promise<Message[]> {
        let entries = new Array<Message>();
        let lastId;

        while (true) {
            const options = { limit: 100 };
            const messages = await attendanceLogChannel.fetchMessages(options);
            entries.push(...messages.array());
            lastId = messages.last().id;

            if (messages.size != 100) {
                break;
            }
        }

        this.totalRaids = entries.length;

        return entries;
    }

    public async getAttendanceMap(attendanceLogChannel: TextChannel): Promise<Map<string, number[]>> {
        let entries = await this.getAttendanceEntries(attendanceLogChannel);

        let allEntries = new Map<string, number[]>();

        for (let entry of entries) {
            let endIndex = entry.content.length - 4;
            let cleanString = entry.content.replace(/`/g, '');
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

        return allEntries;
    }

    public getSeniorityMap(attendanceMap: Map<GuildMember, number[]>): Map<GuildMember, number> {
        let seniorityMap = new Map<GuildMember, number>();

        for (let entry of attendanceMap) {
            let raidCount = entry[1].length;
            seniorityMap.set(entry[0], (raidCount / this.totalRaids));
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

    public createLootScoreMap(attendanceMap: Map<GuildMember, number>, seniorityMap: Map<GuildMember, number>, lootLogMap: Map<GuildMember, ItemScore[]>): Map<GuildMember, MemberScore> {
        let lootScoreMap = new Map<GuildMember, MemberScore>();

        for (let entry of attendanceMap) {
            const memberScore = new MemberScore();
            memberScore.attendancePercentage = Math.ceil(entry[1]);
            lootScoreMap.set(entry[0], memberScore);
        }

        for (let entry of seniorityMap) {
            let memberScore = lootScoreMap.get(entry[0]);
            memberScore.seniorityPercentage = Math.ceil(entry[1] * 100);
            lootScoreMap.set(entry[0], memberScore);
        }

        for (let entry of lootLogMap) {
            let memberScore = lootScoreMap.get(entry[0]);

            let total = 0;

            for (let item of entry[1]) {
                total += item.score;
            }

            memberScore.itemScoreTotal = total;
        }

        let sortedMap = this._mapSort.sortByItemScoreTotal(lootScoreMap);
        let highestItemScore = Array.from(sortedMap)[0][1].itemScoreTotal;

        for (let entry of lootScoreMap) {
            let memberScore = lootScoreMap.get(entry[0]);

            if (memberScore.itemScoreTotal) {
                memberScore.itemScorePercentage = (memberScore.itemScoreTotal / highestItemScore) * 100;
            } else {
                memberScore.itemScorePercentage = 0;
            }
        }

        return lootScoreMap;
    }
}
