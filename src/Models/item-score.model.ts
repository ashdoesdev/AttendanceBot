import { GuildMember } from "discord.js";
import { MinimalMember } from "./loot-score.model";

export class ItemScore {
    public shorthand: string;
    public displayName: string;
    public score: number;
    public eligibleClasses: string[];
}

export class AwardedItem {
    public member: MinimalMember;
    public item: ItemScore;
    public offspec: boolean;
    public existing: boolean;
    public flags: string[] = new Array<string>();
}