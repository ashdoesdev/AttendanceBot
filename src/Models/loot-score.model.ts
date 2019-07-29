import { GuildMember } from "discord.js";

export class LootScore {
    public memberLootScores: Map<GuildMember, MemberScore>;
}

export class MemberScore {
    public attendancePercentage: number;
    public seniorityPercentage: number;
    public attendanceTotal: number;
    public itemScoreTotal: number;
    public itemScorePercentage: number;

    public get lootScore(): number {
        let lootScore = this.attendanceTotal || 0;

        if (this.itemScoreTotal) {
            lootScore -= this.itemScoreTotal;
        }

        if (this.attendanceTotal > 48) {
            lootScore += lootScore * .1;
        }

        return Math.round(lootScore);
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