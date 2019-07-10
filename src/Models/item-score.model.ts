import { GuildMember } from "discord.js";

export class ItemScore {
    public shorthand: string;
    public displayName: string;
    public score: number;
    public eligibleClasses: string[];
    public requester?: string;
}