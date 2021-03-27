import { RichEmbed, GuildMember, Collection, Role } from "discord.js";
import { stringify } from "querystring";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberAttendance, MinimalMember } from "../Models/AttendanceData";

export class PublicAttendanceEmbed extends RichEmbed {
    private _embedHelper: EmbedHelper = new EmbedHelper();
    private _appSettings;

    constructor(memberEntry: [GuildMember | MinimalMember, MemberAttendance], appSettings) {
        super();

        this.setColor(appSettings['guildColor']);

        this._appSettings = appSettings;

        this.addMember(memberEntry);
    }

    private addMember(member: [GuildMember | MinimalMember, MemberAttendance]): void {
        this.setAuthor(member[0].displayName, (member[0] as GuildMember).user.avatarURL);

        let visibleRoles = Object.entries(this._appSettings['visibleRoles']);
        let memberRoles = (member[0] as GuildMember).roles.array().filter((x) => visibleRoles.some((y) => y[1] === x.id));

        this.setDescription(memberRoles.join(' '));
        this.addField(`**${member[1].attendancePercentage || 0}%** attendance`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`**${member[1].seniorityPercentage || 0}%** seniority`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}