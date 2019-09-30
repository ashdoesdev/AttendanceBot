"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class AttendanceEmbed extends discord_js_1.RichEmbed {
    constructor(attendanceMap) {
        super();
        this.attendanceMap = attendanceMap;
        let attendanceLines = '';
        for (let member of attendanceMap) {
            attendanceLines += `**${member[0]}**: ${member[1]}% \n`;
        }
        this.setColor('#60b5bc');
        this.setDescription(attendanceLines);
        this.setFooter(`Attendance Log | ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' })}`);
    }
}
exports.AttendanceEmbed = AttendanceEmbed;
