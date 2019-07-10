import { GuildMember } from "discord.js";

export class LootScore {
    public memberLootScores: Map<GuildMember, MemberScore>;
}

export class MemberScore {
    public attendancePercentage: number;
    public seniorityPercentage: number;

    public get lootScore(): number {
        return this.attendancePercentage + this.seniorityPercentage;
    }
}


