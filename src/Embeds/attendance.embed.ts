import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";

export class AttendanceEmbed extends RichEmbed {
    private _timestampHelper: TimestampHelper = new TimestampHelper();

    constructor(private attendanceMap: Map<string, number>) {
        super();

        let attendanceLines: string = '';

        for (let member of attendanceMap) {
            attendanceLines += `**${member[0]}**: ${member[1]}% \n`;
        }

        this.setDescription(attendanceLines);
        this.setFooter(`Attendance Log | ${this._timestampHelper.monthDayYearFormatted}`);
    }
}