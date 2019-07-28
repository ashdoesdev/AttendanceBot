"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const timestamp_helper_1 = require("../Helpers/timestamp.helper");
class MinimalVisualizationEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap, title) {
        super();
        this.lootScoreMap = lootScoreMap;
        this._timestampHelper = new timestamp_helper_1.TimestampHelper();
        let memberLines = '';
        for (let member of lootScoreMap) {
            memberLines += `**${member[0].displayName}**: ${member[1].attendancePercentage}% / ${member[1].seniorityPercentage}% / ${member[1].lootScore} \n`;
        }
        this.setTitle(title);
        this.addField('**Name**: Attendance / Seniority / LootScore', memberLines);
    }
}
exports.MinimalVisualizationEmbed = MinimalVisualizationEmbed;
