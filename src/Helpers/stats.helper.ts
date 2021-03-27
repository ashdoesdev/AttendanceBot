import { GuildMember } from "discord.js";
import { MinimalMember, MemberAttendance } from "../Models/AttendanceData";
import { MapSortHelper } from "./map-sort.helper";

export class StatsHelper {
    private _mapSort = new MapSortHelper();

    public getAverageAttendance(lootScoreMap: Map<GuildMember | MinimalMember, MemberAttendance>, activeMembers: string[]): number {
        let memberCount = 0;
        let attendanceCount = 0;
        let filteredMap = this._mapSort.filterMembers(lootScoreMap, activeMembers);

        for (let entry of filteredMap) {
            memberCount++;
            attendanceCount += entry[1].attendancePercentage;
        }

        return attendanceCount / memberCount;
    }

    public getAverageSeniority(lootScoreMap: Map<GuildMember | MinimalMember, MemberAttendance>, activeMembers: string[]): number {
        let memberCount = 0;
        let seniorityCount = 0;
        let filteredMap = this._mapSort.filterMembers(lootScoreMap, activeMembers);

        for (let entry of filteredMap) {
            memberCount++;
            seniorityCount += entry[1].seniorityPercentage;
        }

        return seniorityCount / memberCount;
    }

    public getFrequenciesMap(array: Array<string>): Map<string, number> {
        return new Map([...new Set(array)].map(
            x => [x, array.filter(y => y === x).length]
        ));
    }
}