import { RichEmbed, GuildMember } from "discord.js";
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

        let visibleRoles = Array.from(this._appSettings['visibleRoles']);
        let memberRoles;

        for (let role of visibleRoles) {
            if ((member[0] as GuildMember).roles.array().filter((x) => x.id === role[1])) {
                memberRoles += role[1] + " ";
            }
        }
        this.setDescription(memberRoles);
        this.addField(`**${member[1].attendancePercentage || 0}%** attendance`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`**${member[1].seniorityPercentage || 0}%** seniority`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}