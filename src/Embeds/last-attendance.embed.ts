import { RichEmbed, GuildMember } from "discord.js";
import { AttendanceEntry } from "../Models/AttendanceData";
import { MemberMatchHelper } from "../Helpers/member-match.helper";

export class LastAttendanceEmbed extends RichEmbed {
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();

    constructor(private attendance: AttendanceEntry<[string, number][]>, private guildMembers: GuildMember[], appSettings) {
        super();

        let mostRecentDate = new Date(attendance.signature.timestamp).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' });

        let attendanceLines: string = '';

        let attendanceNameArray = new Array<[string, number]>();

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

