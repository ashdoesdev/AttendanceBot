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

export class LootScoreData<T> {
    public value: T;
    public signature: Signature;
}

export class Signature {
    public requester: MinimalMember;
    public timestamp: string;
}

export class MinimalMember {
    public id: string;
    public displayName: string;
}