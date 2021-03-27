import { GuildMember } from "discord.js";
import { MemberAttendance, MinimalMember } from "Models/AttendanceData";

export class MapSortHelper {
    public sortByAttendance(lootScoreMap: Map<GuildMember | MinimalMember, MemberAttendance>): Map<GuildMember | MinimalMember, MemberAttendance> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].attendancePercentage - a[1].attendancePercentage);
        return new Map(array);
    }

    public sortBySeniority(lootScoreMap: Map<GuildMember | MinimalMember, MemberAttendance>): Map<GuildMember | MinimalMember, MemberAttendance> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].seniorityPercentage - a[1].seniorityPercentage);
        return new Map(array);
    }

    public sortByName(lootScoreMap: Map<GuildMember | MinimalMember, MemberAttendance>): Map<GuildMember | MinimalMember, MemberAttendance> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => a[0].displayName.localeCompare(b[0].displayName));
        return new Map(array);
    }

    public filterMembers(lootScoreMap: Map<GuildMember | MinimalMember, MemberAttendance>, members: string[]): Map<GuildMember | MinimalMember, MemberAttendance> {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => members.includes(value[0].id));
        return new Map(filteredArray);
    }

    public filterOutMembers(lootScoreMap: Map<GuildMember | MinimalMember, MemberAttendance>, members: string[]): Map<GuildMember | MinimalMember, MemberAttendance> {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => !members.includes(value[0].id));
        return new Map(filteredArray);
    }
}