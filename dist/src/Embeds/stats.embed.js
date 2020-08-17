"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const stats_helper_1 = require("../Helpers/stats.helper");
class StatsEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap, lootLogChannel, members, activeMembers, itemCountMap) {
        super();
        this._statsHelper = new stats_helper_1.StatsHelper();
        this.setColor('#60b5bc');
        this.setTitle('SnS Raid Stats');
        let averageAttendance = this._statsHelper.getAverageAttendance(lootScoreMap, activeMembers);
        let averageSeniority = this._statsHelper.getAverageSeniority(lootScoreMap, activeMembers);
        this.addField('Average Attendance', averageAttendance);
        this.addField('Average Seniority', averageSeniority);
        this.addField('Items Looted', 'Output below. May take a moment.');
    }
}
exports.StatsEmbed = StatsEmbed;
