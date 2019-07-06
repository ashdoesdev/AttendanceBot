import { RichEmbed, GuildMember } from "discord.js";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberScore } from "../Models/loot-score.model";

export class SeniorityEmbed extends RichEmbed {
    private _embedHelper: EmbedHelper = new EmbedHelper();

    constructor(lootScoreMap: Map<GuildMember, MemberScore>) {
        super();

        for (let member of lootScoreMap) {
            this.addMember(member);
        }
    }

    private addMember(member: [GuildMember, MemberScore]): void {
        this.addField(member[0].displayName, member[0].highestRole.name, true);
        this.addField(`${member[1].attendancePercentage}%`, this._embedHelper.getBar(member[1].attendancePercentage), true);
        this.addField(`${member[1].seniorityPercentage}%`, this._embedHelper.getBar(member[1].seniorityPercentage), true);
    }
}