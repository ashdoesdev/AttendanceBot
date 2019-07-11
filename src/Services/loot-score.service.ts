import { GuildMember, TextChannel, Message } from "discord.js";
import { MemberScore, LootScoreData } from "../Models/loot-score.model";

export class LootScoreService {
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

    public createLootScoreMap(attendanceMap: Map<GuildMember, number>, seniorityMap: Map<GuildMember, number>): Map<GuildMember, MemberScore> {
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

        return lootScoreMap;
    }
}
