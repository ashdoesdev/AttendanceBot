import { GuildMember } from "discord.js";

export class LootScore {
    public memberLootScores: Map<GuildMember, MemberScore>;
}

export class MemberScore {
    //public memberId: number; // just in case?

    public attendancePercentage: number;
    public seniorityPercentage: number;

    public get lootScore(): number {
        return this.attendancePercentage + this.seniorityPercentage;
    }

    //public lootHistory: Map<string, number>; // item name, item cost/value

    //public get lootCount(): number {
    //    let count = 0;

    //    for (let entry of this.lootHistory) {
    //        count += entry[1];
    //    }

    //    return count;
    //}

}


