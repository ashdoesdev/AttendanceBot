import { RichEmbed } from "discord.js";

export class AttendanceLogEmbed extends RichEmbed {
    constructor(private attendanceMap: Map<string, number>, appSettings) {
        super();

        let attendanceLines: string = '';

        for (let member of attendanceMap) {
            attendanceLines += `**${member[0]}**: ${member[1]}% \n`;
        }

        this.setColor(appSettings['guildColor']);
        this.setDescription(attendanceLines);
        this.setFooter(`Attendance Log | ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' })}`);
    }
}