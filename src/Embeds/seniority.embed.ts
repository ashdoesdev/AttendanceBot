import { RichEmbed, GuildMember } from "discord.js";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberScore } from "../Models/loot-score.model";

export class SeniorityEmbed extends RichEmbed {
    private _embedHelper: EmbedHelper = new EmbedHelper();

    constructor(lootScoreMap: Map<GuildMember, MemberScore>, memberEntry: [GuildMember, MemberScore]) {
        super();

        this.addMember(memberEntry);
    }

    private getHighestDisplayRole(member: GuildMember): string {
        if (member.roles.array().find((x) => x.name === 'Leadership')) {
            return 'Leadership';
        } else if (member.roles.array().find((x) => x.name === 'Raider')) {
            return 'Raider';
        } else if (member.roles.array().find((x) => x.name === 'Applicant')) {
            return 'Applicant';
        } else if (member.roles.array().find((x) => x.name === 'Community')) {
            return 'Community';
        } else {
            return 'Role not set'
        }
    }

    private addMember(member: [GuildMember, MemberScore]): void {
        this.addField(member[0].displayName, this.getHighestDisplayRole(member[0]), true);
        this.addField(`${member[1].attendancePercentage || 0}%`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`${member[1].seniorityPercentage || 0}%`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}