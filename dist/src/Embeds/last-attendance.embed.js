"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const member_match_helper_1 = require("../Helpers/member-match.helper");
class LastAttendanceEmbed extends discord_js_1.RichEmbed {
    constructor(attendance, guildMembers, appSettings) {
        super();
        this.attendance = attendance;
        this.guildMembers = guildMembers;
        this._memberMatcher = new member_match_helper_1.MemberMatchHelper();
        let mostRecentDate = new Date(attendance.signature.timestamp).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' });
        let attendanceLines = '';
        let attendanceNameArray = new Array();
        for (let entry of attendance.value) {
            let member = this._memberMatcher.matchMemberFromId(guildMembers, entry[0]);
            if (member) {
                attendanceNameArray.push([member.displayName, entry[1]]);
            }
        }
        attendanceNameArray.sort((a, b) => a[0].localeCompare(b[0]));
        for (let entry of attendanceNameArray) {
            attendanceLines += `**${entry[0]}**: ${entry[1]}%\n`;
        }
        this.setColor(appSettings['guildColor']);
        this.setTitle(`Last Attendance (**${mostRecentDate}**)`);
        this.setDescription(attendanceLines);
    }
}
exports.LastAttendanceEmbed = LastAttendanceEmbed;
