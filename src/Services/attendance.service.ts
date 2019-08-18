import { GuildMember, Message, VoiceChannel, TextChannel } from "discord.js";
import { Subscription, timer } from "rxjs";
import { inspect } from "util";
import { AttendanceEmbed } from "../Embeds/attendance.embed";
import { LootScoreDataHelper } from "../Helpers/loot-score-data.helper";
import { LootScoreService } from "./loot-score.service";

export class AttendanceService {
    private _tick = 0;
    private _timerSubscription: Subscription;
    private _dataHelper: LootScoreDataHelper = new LootScoreDataHelper();
    private _lootScoreService: LootScoreService = new LootScoreService();

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

    public async createMinifiedSeniorityMap(minifiedAttendanceMap: Map<string, number>, seniorityLogChannel: TextChannel): Promise<Map<string, number>> {
        let seniorityMap = await this._lootScoreService.getSeniorityMap(seniorityLogChannel);

        for (let entry of seniorityMap) {
            seniorityMap.set(entry[0], seniorityMap.get(entry[0]) + 1);
        }

        for (let entry of minifiedAttendanceMap) {
            if (!seniorityMap.get(entry[0])) {
                seniorityMap.set(entry[0], 1);
            }
        }

        return seniorityMap;
    }

    public startLogging(message: Message, raidChannel1: VoiceChannel, raidChannel2: VoiceChannel): void {
        this.loggingInProgress = true;

        message.channel.send('Starting attendance log. Make sure you are in the raid channel.');
        message.channel.send('*Don\'t fret. There is a 5 minute grace period at beginning and end.*');
        message.channel.send(':snail:');

        this._timerSubscription = timer(0, 60000).subscribe(() => {
            this._tick++;
            if (Array.from(raidChannel1.members.values())) {
                if (Array.from(raidChannel2.members.values()).length > 0) {
                    this.attendanceLog.set(
                        this._tick,
                        Array.from(raidChannel1.members.values())
                            .concat(Array.from(raidChannel2.members.values()))
                    );
                } else {
                    this.attendanceLog.set(
                        this._tick,
                        Array.from(raidChannel1.members.values())
                    );
                }
            } else {
                this.attendanceLog.set(
                    this._tick,
                    Array.from(raidChannel1.members.values())
                );
            }
        });
    }

    public async endLogging(message: Message, seniorityLogChannel: TextChannel, attendanceLogChannel: TextChannel, attendanceLogReadableChannel: TextChannel, saveValues: boolean, updateDump?): Promise<void> {
        if (saveValues) {
            if (this._tick === 1) {
                message.channel.send(`Ended attendance log. Total duration: ${this._tick} minute`);
            } else {
                message.channel.send(`Ended attendance log. Total duration: ${this._tick} minutes`);
            }

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
            let attendanceLootScoreData = this._dataHelper.createLootScoreData(minifiedAttendanceArray, message);

            if (seniorityLogChannel) {
                const minifiedSeniorityMap = await this.createMinifiedSeniorityMap(minifiedAttendanceMap, seniorityLogChannel);
                const minifiedSeniorityArray = Array.from(minifiedSeniorityMap.entries());
                let seniorityLootScoreData = this._dataHelper.createLootScoreData(minifiedSeniorityArray, message);
                seniorityLogChannel.send(this.codeBlockify(JSON.stringify(seniorityLootScoreData)));
            }

            attendanceLogChannel.send(this.codeBlockify(JSON.stringify(attendanceLootScoreData)));
            attendanceLogReadableChannel.send(new AttendanceEmbed(readableMinifiedAttendanceMap));

            if (updateDump) {
                updateDump();
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
}