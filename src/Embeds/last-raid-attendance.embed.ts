import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";
import { MemberScore, LootScoreData } from "../Models/loot-score.model";
import { AwardedItem } from "../Models/item-score.model";
import { MemberMatchHelper } from "../Helpers/member-match.helper";

export class LastRaidAttendanceEmbed extends RichEmbed {
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();

    constructor(private attendance: LootScoreData<[string, number][]>, private guildMembers: GuildMember[]) {
        super();

        let raidDate = new Date(attendance.signature.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });

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

        this.setColor('#60b5bc');
        this.setTitle(`Attendance Last Raid (**${raidDate}**)`);
        this.setDescription(attendanceLines);
    }

}

