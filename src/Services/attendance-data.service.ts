import { GuildMember, TextChannel } from "discord.js";
import { AttendanceEntry, MemberAttendance, MinimalMember } from "../Models/AttendanceData";
import { MessagesHelper } from "../Helpers/messages.helper";

export class AttendanceDataService {
    private _messages: MessagesHelper = new MessagesHelper();

    public async getAttendanceMap(attendanceLogChannel: TextChannel): Promise<Map<string, number[]>> {
        let entries = await this._messages.getMessages(attendanceLogChannel);

        let allEntries = new Map<string, number[]>();

        for (let entry of entries) {
            let endIndex = entry.content.length - 4;
            let cleanString = entry.content.replace(/`/g, '');

            if (cleanString.length > 0) {
                let lootScoreData: AttendanceEntry<[string, number][]> = JSON.parse(cleanString);
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
                let lootScoreData: AttendanceEntry<[string, number][]> = JSON.parse(cleanString);
                for (let x of lootScoreData.value) {
                    seniorityMap.set(x[0], x[1]);
                }
            }
        }

        return seniorityMap;
    }

    public createAttendanceDataMap(attendanceMap: Map<GuildMember, number[]>, seniorityMap: Map<GuildMember, number>): Map<GuildMember | MinimalMember, MemberAttendance> {
        let attendanceDataMap = new Map<GuildMember | MinimalMember, MemberAttendance>();

        for (let entry of attendanceMap) {
            let memberScore = attendanceDataMap.get(entry[0]);

            if (!memberScore) {
                memberScore = new MemberAttendance();
            }

            let raidCountExpected = seniorityMap.get(entry[0]);
            let sum = entry[1].reduce(function (a, b) { return a + b; });
            let avg = sum / raidCountExpected || 0;

            memberScore.attendancePercentage = Math.round(avg);
            attendanceDataMap.set(entry[0], memberScore);
        }

        let highestValue = 1;

        for (let entry of seniorityMap) {
            if (entry[1] > highestValue) {
                highestValue = entry[1];
            }
        }

        for (let entry of seniorityMap) {
            let memberScore = attendanceDataMap.get(entry[0]);

            if (!memberScore) {
                memberScore = new MemberAttendance();
            }

            var seniority = Math.round((entry[1] / 50) * 100);

            if (seniority > 100) {
                seniority = 100;
            }

            memberScore.seniorityPercentage = seniority;
            attendanceDataMap.set(entry[0], memberScore);
        }

        return attendanceDataMap;
    }

}
