import { GuildMember, Message, VoiceChannel, TextChannel } from "discord.js";
import { Subscription, timer } from "rxjs";
import { AttendanceLogEmbed } from "../Embeds/attendance-log.embed";
import { AttendanceEntryHelper } from "../Helpers/loot-score-data.helper";
import { AttendanceDataService } from "./attendance-data.service";
import { MemberMatchHelper } from "../Helpers/member-match.helper";

export class AttendanceService {
    private _tick = 0;
    private _timerSubscription: Subscription;
    private _dataHelper: AttendanceEntryHelper = new AttendanceEntryHelper();
    private _lootScoreService: AttendanceDataService = new AttendanceDataService();
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();

    public attendanceLog = new Map<number, GuildMember[]>();
    public seniorityLog = new Map<GuildMember, number>();
    public loggingInProgress: boolean;

    public createMinifiedAttendanceMap(attendanceLog: Map<number, GuildMember[]>): Map<string, number> {
        const attendanceMap = new Map<string, number>();

        for (let logEntry of attendanceLog) {
            for (let member of logEntry[1]) {
                if (!attendanceMap.has(member.id)) {
                    attendanceMap.set(member.id, 1);
                } else {
                    attendanceMap.set(member.id, attendanceMap.get(member.id) + 1);
                }
            }
        }

        for (let entry of attendanceMap) {
            attendanceMap.set(entry[0], Math.round((attendanceMap.get(entry[0]) / attendanceLog.size) * 100));
        }

        return attendanceMap;
    }
        
    public createReadableMinifiedAttendanceMap(attendanceLog: Map<number, GuildMember[]>): Map<string, number> {
        const attendanceMap = new Map<string, number>();

        for (let logEntry of attendanceLog) {
            for (let member of logEntry[1]) {
                if (!attendanceMap.has(member.displayName)) {
                    attendanceMap.set(member.displayName, 1);
                } else {
                    attendanceMap.set(member.displayName, attendanceMap.get(member.displayName) + 1);
                }
            }
        }

        for (let entry of attendanceMap) {
            attendanceMap.set(entry[0], Math.round((attendanceMap.get(entry[0]) / attendanceLog.size) * 100));
        }

        return attendanceMap;
    }

    public async createMinifiedSeniorityMap(minifiedAttendanceMap: Map<string, number>, seniorityLogChannel: TextChannel, guildMembers: GuildMember[], appSettings: any): Promise<Map<string, number>> {
        let seniorityMap = await this._lootScoreService.getSeniorityMap(seniorityLogChannel);

        for (let entry of seniorityMap) {
            let member = this._memberMatcher.matchMemberFromId(guildMembers, entry[0]);

            if (member && member instanceof GuildMember) {
                if (this.memberShouldBeTracked(member, appSettings)) {
                    seniorityMap.set(entry[0], seniorityMap.get(entry[0]) + 1);
                } else {
                    seniorityMap.delete(entry[0]);
                }
            } else {
                seniorityMap.delete(entry[0]);
            }

        }

        for (let entry of minifiedAttendanceMap) {
            if (!seniorityMap.get(entry[0])) {
                seniorityMap.set(entry[0], 1);
            }
        }

        return seniorityMap;
    }

    public startLogging(message: Message, attendanceChannels: VoiceChannel[], appSettings: any): void {
        this.loggingInProgress = true;

        message.channel.send('Starting attendance log. Make sure you are in the raid channel.');
        message.channel.send('*Don\'t fret. There is a 5 minute grace period at beginning and end.*');
        message.channel.send(':snail:');

        this._timerSubscription = timer(0, 60000).subscribe(() => {
            this._tick++;

            let memberArray;

            for (let channel of attendanceChannels) {
                if (Array.from(channel.members.values())) {
                    memberArray = memberArray.concat(Array.from(channel.members.values()));
                }
            }

            memberArray = memberArray.filter((member) => this.memberShouldBeTracked(member, appSettings));

            let uniqueArray = memberArray.filter((member, index, self) =>
                index === self.findIndex((m) => (
                    m.id === member.id
                ))
            );

            this.attendanceLog.set(
                this._tick,
                uniqueArray
            );
        });
    }

    public async endLogging(message: Message, seniorityLogChannel: TextChannel, attendanceLogChannel: TextChannel, attendanceLogReadableChannel: TextChannel, guildMembers: GuildMember[], appSettings: any, saveValues: boolean, updatePublicChart?): Promise<void> {
        if (saveValues) {
            let attendanceArray = Array.from(this.attendanceLog.entries());
            if (attendanceArray.length > 10) {
                attendanceArray = attendanceArray.slice(5, attendanceArray.length - 5);
            }

            let modifiedAttendanceLog = new Map<number, GuildMember[]>();
            for (let entry of attendanceArray) {
                modifiedAttendanceLog.set(entry[0], entry[1]);
            }

            const minifiedAttendanceMap = this.createMinifiedAttendanceMap(modifiedAttendanceLog);
            const readableMinifiedAttendanceMap = this.createReadableMinifiedAttendanceMap(modifiedAttendanceLog);
            const minifiedAttendanceArray = Array.from(minifiedAttendanceMap.entries());
            let attendanceLootScoreData = this._dataHelper.createAttendanceData(minifiedAttendanceArray, message);

            attendanceLogChannel.send(this.codeBlockify(JSON.stringify(attendanceLootScoreData)));
            attendanceLogReadableChannel.send(new AttendanceLogEmbed(readableMinifiedAttendanceMap, appSettings));

            if (seniorityLogChannel) {
                const minifiedSeniorityMap = await this.createMinifiedSeniorityMap(minifiedAttendanceMap, seniorityLogChannel, guildMembers, appSettings);
                const minifiedSeniorityArray = Array.from(minifiedSeniorityMap.entries());
                let seniorityLootScoreData = this._dataHelper.createAttendanceData(minifiedSeniorityArray, message);
                seniorityLogChannel.send(this.codeBlockify(JSON.stringify(seniorityLootScoreData)));
            }

            if (this._tick === 1) {
                message.channel.send(`Attendance saved. Total duration: ${this._tick} minute`);
            } else {
                message.channel.send(`Attendance saved. Total duration: ${this._tick} minutes`);
            }

            if (updatePublicChart) {
                updatePublicChart();
            }
        }

        this._tick = 0;
        this._timerSubscription.unsubscribe();
        this.loggingInProgress = false;
        this.attendanceLog = new Map<number, GuildMember[]>();
    }

    private codeBlockify(string: string): string {
        return '```' + string + '```';
    }

    private memberShouldBeTracked(member: GuildMember, appSettings: any): boolean {
        if (member.roles.array().length > 0) {
            for (let role of Array.from(appSettings['visibleRoles'])) {
                if (member.roles.array().find((x) => x.id === role[1])) {
                    return true;
                }
            }
        }
    }
}