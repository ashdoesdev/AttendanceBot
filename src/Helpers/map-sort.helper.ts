import { GuildMember } from "discord.js";
import { MemberScore } from "Models/loot-score.model";

export class MapSortHelper {
    public sortByAttendance(lootScoreMap: Map<GuildMember, MemberScore>): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].attendancePercentage - a[1].attendancePercentage);
        return new Map(array);
    }

    public sortByLootScore(lootScoreMap: Map<GuildMember, MemberScore>): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].lootScore - a[1].lootScore);
        return new Map(array);
    }

    public sortBySeniority(lootScoreMap: Map<GuildMember, MemberScore>): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].seniorityPercentage - a[1].seniorityPercentage);
        return new Map(array);
    }

    public sortByName(lootScoreMap: Map<GuildMember, MemberScore>): Map<GuildMember, MemberScore> {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => a[0].displayName.localeCompare(b[0].displayName));
        return new Map(array);
    }

    public sortByDistance(relatedTermsMap: Map<string, number>): Map<string, number> {
        const array = Array.from(relatedTermsMap);
        array.sort((a, b) => a[1] - b[1]);
        return new Map(array);
    }
}