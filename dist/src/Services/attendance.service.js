"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const minimal_visualization_embed_1 = require("../Embeds/minimal-visualization.embed");
const loot_score_data_helper_1 = require("../Helpers/loot-score-data.helper");
const loot_score_service_1 = require("./loot-score.service");
class AttendanceService {
    constructor() {
        this._tick = 0;
        this._dataHelper = new loot_score_data_helper_1.LootScoreDataHelper();
        this._lootScoreService = new loot_score_service_1.LootScoreService();
        this.attendanceLog = new Map();
        this.seniorityLog = new Map();
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
    createMinifiedSeniorityMap(minifiedAttendanceMap, seniorityLogChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let seniorityMap = yield this._lootScoreService.getSeniorityMap(seniorityLogChannel);
            for (let entry of minifiedAttendanceMap) {
                if (seniorityMap.get(entry[0])) {
                    seniorityMap.set(entry[0], seniorityMap.get(entry[0]) + 1);
                }
                else {
                    seniorityMap.set(entry[0], 1);
                }
            }
            return seniorityMap;
        });
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
    endLogging(message, seniorityLogChannel, attendanceLogChannel, attendanceLogReadableChannel, saveValues = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (saveValues) {
                if (this._tick === 1) {
                    message.channel.send(`Ended attendance log. Total duration: ${this._tick} minute`);
                }
                else {
                    message.channel.send(`Ended attendance log. Total duration: ${this._tick} minutes`);
                }
                const minifiedAttendanceMap = this.createMinifiedAttendanceMap(this.attendanceLog);
                const readableMinifiedAttendanceMap = this.createReadableMinifiedAttendanceMap(this.attendanceLog);
                const minifiedAttendanceArray = Array.from(minifiedAttendanceMap.entries());
                let attendanceLootScoreData = this._dataHelper.createLootScoreData(minifiedAttendanceArray, message);
                const minifiedSeniorityMap = yield this.createMinifiedSeniorityMap(minifiedAttendanceMap, seniorityLogChannel);
                const minifiedSeniorityArray = Array.from(minifiedSeniorityMap.entries());
                let seniorityLootScoreData = this._dataHelper.createLootScoreData(minifiedSeniorityArray, message);
                seniorityLogChannel.send(this.codeBlockify(JSON.stringify(seniorityLootScoreData)));
                attendanceLogChannel.send(this.codeBlockify(JSON.stringify(attendanceLootScoreData)));
                attendanceLogReadableChannel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(readableMinifiedAttendanceMap));
            }
            this._tick = 0;
            this._timerSubscription.unsubscribe();
            this.loggingInProgress = false;
        });
    }
    codeBlockify(string) {
        return '```' + string + '```';
    }
}
exports.AttendanceService = AttendanceService;
