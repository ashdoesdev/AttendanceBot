import { GuildMember, RichEmbed, TextChannel } from "discord.js";
import { MemberAttendance, MinimalMember } from "../Models/AttendanceData";
import { StatsHelper } from "../Helpers/stats.helper";

export class StatsEmbed extends RichEmbed {
    private _statsHelper = new StatsHelper();

    constructor(lootScoreMap: Map<GuildMember | MinimalMember, MemberAttendance>, activeMembers: string[], appSettings) {
        super();

        this.setColor(appSettings['guildColor']);

        this.setTitle('Attendance Stats');

        let averageAttendance = this._statsHelper.getAverageAttendance(lootScoreMap, activeMembers);
        let averageSeniority = this._statsHelper.getAverageSeniority(lootScoreMap, activeMembers);

        this.addField('Average Attendance', averageAttendance);
        this.addField('Average Seniority', averageSeniority);
    }
}

