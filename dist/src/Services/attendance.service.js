"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const minimal_visualization_embed_1 = require("../Embeds/minimal-visualization.embed");
const loot_score_data_helper_1 = require("../Helpers/loot-score-data.helper");
class AttendanceService {
    constructor() {
        this._tick = 0;
        this._dataHelper = new loot_score_data_helper_1.LootScoreDataHelper();
        this.attendanceLog = new Map();
    }
    createAttendanceMap(attendanceLog) {
        const attendanceMap = new Map();
        for (let logEntry of attendanceLog) {
            for (let member of logEntry[1]) {
                if (!attendanceMap.has(member)) {
                    attendanceMap.set(member, 1);
                }
                else {
                    attendanceMap.set(member, attendanceMap.get(member) + 1);
                }
            }
        }
        for (let entry of attendanceMap) {
            attendanceMap.set(entry[0], Math.round((attendanceMap.get(entry[0]) / attendanceLog.size) * 100));
        }
        return attendanceMap;
    }
    createMinifiedAttendanceMap(attendanceLog) {
        const attendanceMap = new Map();
        for (let logEntry of attendanceLog) {
            for (let member of logEntry[1]) {
                if (!attendanceMap.has(member.id)) {
                    attendanceMap.set(member.id, 1);
                }
                else {
                    attendanceMap.set(member.id, attendanceMap.get(member.id) + 1);
                }
            }
        }
        for (let entry of attendanceMap) {
            attendanceMap.set(entry[0], Math.round((attendanceMap.get(entry[0]) / attendanceLog.size) * 100));
        }
        return attendanceMap;
    }
    createReadableMinifiedAttendanceMap(attendanceLog) {
        const attendanceMap = new Map();
        for (let logEntry of attendanceLog) {
            for (let member of logEntry[1]) {
                if (!attendanceMap.has(member.displayName)) {
                    attendanceMap.set(member.displayName, 1);
                }
                else {
                    attendanceMap.set(member.displayName, attendanceMap.get(member.displayName) + 1);
                }
            }
        }
        for (let entry of attendanceMap) {
            attendanceMap.set(entry[0], Math.round((attendanceMap.get(entry[0]) / attendanceLog.size) * 100));
        }
        return attendanceMap;
    }
    startLogging(message, raidChannel1, raidChannel2) {
        this.loggingInProgress = true;
        message.channel.send('Starting attendance log.');
        this._timerSubscription = rxjs_1.timer(0, 60000).subscribe(() => {
            this._tick++;
            if (Array.from(raidChannel1.members.values())) {
                if (Array.from(raidChannel2.members.values()).length > 0) {
                    this.attendanceLog.set(this._tick, Array.from(raidChannel1.members.values())
                        .concat(Array.from(raidChannel2.members.values())));
                }
                else {
                    this.attendanceLog.set(this._tick, Array.from(raidChannel1.members.values()));
                }
            }
            else {
                this.attendanceLog.set(this._tick, Array.from(raidChannel1.members.values()));
            }
        });
    }
    endLogging(message, attendanceLogChannel, attendanceLogReadableChannel, saveValues = true) {
        if (saveValues) {
            if (this._tick === 1) {
                message.channel.send(`Ended attendance log. Total duration: ${this._tick} minute`);
            }
            else {
                message.channel.send(`Ended attendance log. Total duration: ${this._tick} minutes`);
            }
            //const attendanceMap = this.createAttendanceMap(this.attendanceLog);
            const minifiedAttendanceMap = this.createMinifiedAttendanceMap(this.attendanceLog);
            const readableMinifiedAttendanceMap = this.createReadableMinifiedAttendanceMap(this.attendanceLog);
            const minifiedAttendanceArray = Array.from(minifiedAttendanceMap.entries());
            let lootScoreData = this._dataHelper.createLootScoreData(minifiedAttendanceArray, message);
            attendanceLogChannel.send(this.codeBlockify(JSON.stringify(lootScoreData)));
            attendanceLogReadableChannel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(readableMinifiedAttendanceMap));
        }
        this._tick = 0;
        this._timerSubscription.unsubscribe();
        this.loggingInProgress = false;
    }
    codeBlockify(string) {
        return '```' + string + '```';
    }
}
exports.AttendanceService = AttendanceService;
