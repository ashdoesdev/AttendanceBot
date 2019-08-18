import { GuildMember } from "discord.js";

export class LootScore {
    public memberLootScores: Map<GuildMember, MemberScore>;
}

export class MemberScore {
    public attendancePercentage: number = 0;
    public seniorityPercentage: number = 0;
    public attendanceTotal: number = 0;
    public itemScoreTotal: number = 0;
    public itemScoreOffspecTotal: number = 0;
    public lastLootDate: any = 'N/A';
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