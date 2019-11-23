import { RichEmbed, GuildMember } from "discord.js";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberScore, MinimalMember } from "../Models/loot-score.model";

export class PublicAttendanceEmbed extends RichEmbed {
    private _embedHelper: EmbedHelper = new EmbedHelper();
    private _appSettings;

    constructor(memberEntry: [GuildMember | MinimalMember, MemberScore], appSettings) {
        super();

        this._appSettings = appSettings;

        this.addMember(memberEntry);
    }

    private getHighestDisplayRole(member: GuildMember): string {
        if (member.roles.array().find((x) => x.id === this._appSettings['leadership'])) {
            return 'Leadership';
        } else if (member.roles.array().find((x) => x.id === this._appSettings['raider'])) {
            return 'Raider';
        } else if (member.roles.array().find((x) => x.id === this._appSettings['applicant'])) {
            return 'Applicant';
        } else {
            return 'Role not set'
        }
    }

    private addMember(member: [GuildMember | MinimalMember, MemberScore]): void {
        this.setColor('#60b5bc');
        this.setAuthor(member[0].displayName, (member[0] as GuildMember).user.avatarURL);
        this.setDescription((member[0] as GuildMember).roles.array().filter((x) =>
            x.id !== this._appSettings['everyone'] &&
            x.id !== this._appSettings['announcements'] &&
            x.id !== this._appSettings['bossman'] &&
            x.id !== this._appSettings['botadmin'] &&
            x.id !== this._appSettings['discordadmin']).join(' '));
        this.addField(`**${member[1].attendancePercentage || 0}%** attendance`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`**${member[1].seniorityPercentage || 0}%** seniority`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}