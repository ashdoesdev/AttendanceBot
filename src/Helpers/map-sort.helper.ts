import { GuildMember } from "discord.js";
import { MemberScore } from "Models/loot-score.model";

export class MapSortHelper {
    public sortByAttendance(lootScoreMap: Map<GuildMember, MemberScore>, ascending?: boolean): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => a[1].attendancePercentage - b[1].attendancePercentage);
        } else {
            array.sort((a, b) => b[1].attendancePercentage - a[1].attendancePercentage);
        }
        return new Map(array);
    }

    public sortByItemScoreTotal(lootScoreMap: Map<GuildMember, MemberScore>, ascending?: boolean): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => a[1].itemScoreTotal - b[1].itemScoreTotal);
        } else {
            array.sort((a, b) => b[1].itemScoreTotal - a[1].itemScoreTotal);
        }
        return new Map(array);
    }

    public sortByLootScore(lootScoreMap: Map<GuildMember, MemberScore>, ascending?: boolean): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => a[1].lootScore - b[1].lootScore);
        } else {
            array.sort((a, b) => b[1].lootScore - a[1].lootScore);
        }
        return new Map(array);
    }

    public sortBySeniority(lootScoreMap: Map<GuildMember, MemberScore>, ascending?: boolean): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => a[1].seniorityPercentage - b[1].seniorityPercentage);
        } else {
            array.sort((a, b) => b[1].seniorityPercentage - a[1].seniorityPercentage);
        }
        return new Map(array);
    }

    public sortByName(lootScoreMap: Map<GuildMember, MemberScore>, ascending?: boolean): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => b[0].displayName.localeCompare(a[0].displayName));
        } else {
            array.sort((a, b) => a[0].displayName.localeCompare(b[0].displayName));
        }
        return new Map(array);
    }

    public sortByDistance(relatedTermsMap: Map<string, number>, ascending?: boolean): Map<string, number> {
        const array = Array.from(relatedTermsMap);
        if (ascending) {
            array.sort((a, b) => b[1] - a[1]);
        } else {
            array.sort((a, b) => a[1] - b[1]);
        }
        return new Map(array);
    }

    public filterMembers(lootScoreMap: Map<GuildMember, MemberScore>, members: string[]): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => members.includes(value[0].id));
        return new Map(filteredArray);
    }

    public sortByFlag(lootScoreMap: Map<GuildMember, MemberScore>, ascending: boolean, orderByName: boolean, orderByAttendance: boolean, orderBySeniority: boolean): Map<GuildMember, MemberScore> {
        if (orderByName) {
            return this.sortByName(lootScoreMap, ascending);
        }

        if (orderByAttendance) {
            return this.sortByAttendance(lootScoreMap, ascending);
        }

        if (orderBySeniority) {
            return this.sortBySeniority(lootScoreMap, ascending);
        }

        return this.sortByLootScore(lootScoreMap, ascending);
    }
}