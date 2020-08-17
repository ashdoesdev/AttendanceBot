import { GuildMember, RichEmbed, TextChannel } from "discord.js";
import { MemberScore, MinimalMember } from "../Models/loot-score.model";
import { StatsHelper } from "../Helpers/stats.helper";

export class StatsEmbed extends RichEmbed {
    private _statsHelper = new StatsHelper();

    constructor(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>, lootLogChannel: TextChannel, members: GuildMember[], activeMembers: string[], itemCountMap: Map<string, number>) {
        super();

        this.setColor('#60b5bc');

        this.setTitle('SnS Raid Stats');

        let averageAttendance = this._statsHelper.getAverageAttendance(lootScoreMap, activeMembers);
        let averageSeniority = this._statsHelper.getAverageSeniority(lootScoreMap, activeMembers);

        this.addField('Average Attendance', averageAttendance);
        this.addField('Average Seniority', averageSeniority);
        this.addField('Items Looted', 'Output below. May take a moment.');
    }
}

