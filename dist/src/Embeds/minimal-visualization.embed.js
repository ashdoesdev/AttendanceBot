"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const timestamp_helper_1 = require("../Helpers/timestamp.helper");
class MinimalVisualizationEmbed extends discord_js_1.RichEmbed {
    constructor(attendanceMap) {
        super();
        this.attendanceMap = attendanceMap;
        this._timestampHelper = new timestamp_helper_1.TimestampHelper();
        let attendanceLines = '';
        for (let member of attendanceMap) {
            attendanceLines += `**${member[0]}**: ${member[1]}% \n`;
        }
        this.setDescription(attendanceLines);
        this.setFooter(`Attendance Log | ${this._timestampHelper.monthDayYearFormatted}`);
    }
}
exports.MinimalVisualizationEmbed = MinimalVisualizationEmbed;
