import { RichEmbed } from "discord.js";

export class AttendanceEmbed extends RichEmbed {
    constructor(private attendanceMap: Map<string, number>) {
        super();

        let attendanceLines: string = '';

        for (let member of attendanceMap) {
            attendanceLines += `**${member[0]}**: ${member[1]}% \n`;
        }

        this.setColor('#60b5bc');
        this.setDescription(attendanceLines);
        this.setFooter(`Attendance Log | ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' })}`);
    }
}