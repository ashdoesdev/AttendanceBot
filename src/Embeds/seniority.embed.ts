import { RichEmbed, GuildMember } from "discord.js";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberScore } from "../Models/loot-score.model";

export class SeniorityEmbed extends RichEmbed {
    private _embedHelper: EmbedHelper = new EmbedHelper();

    constructor(lootScoreMap: Map<GuildMember, MemberScore>, memberEntry: [GuildMember, MemberScore]) {
        super();

        this.addMember(memberEntry);
    }

    private addMember(member: [GuildMember, MemberScore]): void {
        this.addField(member[0].displayName, member[0].highestRole.name, true);
        this.addField(`${member[1].attendancePercentage || 0}%`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`${member[1].seniorityPercentage || 0}%`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}