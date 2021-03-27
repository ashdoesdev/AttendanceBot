"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const stats_helper_1 = require("../Helpers/stats.helper");
class StatsEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap, activeMembers, appSettings) {
        super();
        this._statsHelper = new stats_helper_1.StatsHelper();
        this.setColor(appSettings['guildColor']);
        this.setTitle('Attendance Stats');
        let averageAttendance = this._statsHelper.getAverageAttendance(lootScoreMap, activeMembers);
        let averageSeniority = this._statsHelper.getAverageSeniority(lootScoreMap, activeMembers);
        this.addField('Average Attendance', averageAttendance);
        this.addField('Average Seniority', averageSeniority);
    }
}
exports.StatsEmbed = StatsEmbed;
