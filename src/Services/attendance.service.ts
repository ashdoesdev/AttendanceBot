import { GuildMember, Message, VoiceChannel, TextChannel } from "discord.js";
import { Subscription, timer } from "rxjs";
import { inspect } from "util";
import { MinimalVisualizationEmbed } from "../Embeds/minimal-visualization.embed";

export class AttendanceService {
    private _tick = 0;
    private _timerSubscription: Subscription;

    public attendanceLog = new Map<number, GuildMember[]>();
    public loggingInProgress: boolean;

    public createAttendanceMap(attendanceLog: Map<number, GuildMember[]>): Map<GuildMember, number> {
        const attendanceMap = new Map<GuildMember, number>();

        for (let logEntry of attendanceLog) {
            for (let member of logEntry[1]) {
                if (!attendanceMap.has(member)) {
                    attendanceMap.set(member, 1);
                } else {
                    attendanceMap.set(member, attendanceMap.get(member) + 1);
                }
            }
        }

        for (let entry of attendanceMap) {
            attendanceMap.set(entry[0], Math.round((attendanceMap.get(entry[0]) / attendanceLog.size) * 100));
        }

        return attendanceMap;
    }
    
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

    public startLogging(message: Message, raidChannel1: VoiceChannel, raidChannel2: VoiceChannel): void {
        this.loggingInProgress = true;

        message.channel.send('Starting attendance log.');

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

    public endLogging(message: Message, attendanceLogChannel: TextChannel, attendanceLogReadableChannel: TextChannel, saveValues: boolean = true): void {
        if (saveValues) {
            if (this._tick === 1) {
                message.channel.send(`Ended attendance log. Total duration: ${this._tick} minute`);
            } else {
                message.channel.send(`Ended attendance log. Total duration: ${this._tick} minutes`);
            }

            //const attendanceMap = this.createAttendanceMap(this.attendanceLog);

            const minifiedAttendanceMap = this.createMinifiedAttendanceMap(this.attendanceLog);
            const readableMinifiedAttendanceMap = this.createReadableMinifiedAttendanceMap(this.attendanceLog);

            attendanceLogChannel.send(this.codeBlockify(JSON.stringify(Array.from(minifiedAttendanceMap.entries()))));
            attendanceLogReadableChannel.send(new MinimalVisualizationEmbed(readableMinifiedAttendanceMap));

            //message.channel.send(new RaidEntryEmbed(attendanceMap));
        }

        this._tick = 0;
        this._timerSubscription.unsubscribe();
        this.loggingInProgress = false;
    }

    private codeBlockify(string: string): string {
        return '```' + string + '```';
    }
}