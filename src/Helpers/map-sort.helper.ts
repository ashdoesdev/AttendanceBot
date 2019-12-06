import { GuildMember } from "discord.js";
import { MemberScore, MinimalMember } from "Models/loot-score.model";

export class MapSortHelper {
    public sortByAttendance(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>): Map<GuildMember | MinimalMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].attendancePercentage - a[1].attendancePercentage);
        return new Map(array);
    }

    public sortByItemScoreTotal(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>): Map<GuildMember | MinimalMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => a[1].itemScoreTotal - b[1].itemScoreTotal);
        return new Map(array);
    }
    
    public sortByItemScoreOffspecTotal(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>): Map<GuildMember | MinimalMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => a[1].itemScoreOffspecTotal - b[1].itemScoreOffspecTotal);
        return new Map(array);
    }
        
    public sortByLastLootDate(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>): Map<GuildMember | MinimalMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => {
            var dateA = new Date(a[1].lastLootDate).getTime();
            var dateB = new Date(b[1].lastLootDate).getTime();

            if (a[1].lastLootDate === '---') {
                return -1;
            } else if (b[1].lastLootDate === '---') {
                return 1;
            } else {
                return dateA - dateB;
            }
        });
        return new Map(array);
    }

    public sortBySeniority(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>): Map<GuildMember | MinimalMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].seniorityPercentage - a[1].seniorityPercentage);
        return new Map(array);
    }

    public sortByName(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>): Map<GuildMember | MinimalMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => a[0].displayName.localeCompare(b[0].displayName));
        return new Map(array);
    }

    public filterMembers(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>, members: string[]): Map<GuildMember | MinimalMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => members.includes(value[0].id));
        return new Map(filteredArray);
    }

    public filterOutMembers(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>, members: string[]): Map<GuildMember | MinimalMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => !members.includes(value[0].id));
        return new Map(filteredArray);
    }

    public sortByFlag(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>, orderByName: boolean, orderByAttendance: boolean, orderBySeniority: boolean, orderByOffspecItemScore: boolean, orderByLastLootDate: boolean): Map<GuildMember | MinimalMember, MemberScore> {
        if (orderByName) {
            return this.sortByName(lootScoreMap);
        }

        if (orderByAttendance) {
            return this.sortByAttendance(lootScoreMap);
        }

        if (orderBySeniority) {
            return this.sortBySeniority(lootScoreMap);
        }

        if (orderByOffspecItemScore) {
            return this.sortByItemScoreOffspecTotal(lootScoreMap);
        }

        if (orderByLastLootDate) {
            return this.sortByLastLootDate(lootScoreMap);
        }

        return this.sortByItemScoreTotal(lootScoreMap);
    }
}