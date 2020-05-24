"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const rxjs_1 = require("rxjs");
const attendance_embed_1 = require("../Embeds/attendance.embed");
const loot_score_data_helper_1 = require("../Helpers/loot-score-data.helper");
const loot_score_service_1 = require("./loot-score.service");
const member_match_helper_1 = require("../Helpers/member-match.helper");
class AttendanceService {
    constructor() {
        this._tick = 0;
        this._dataHelper = new loot_score_data_helper_1.LootScoreDataHelper();
        this._lootScoreService = new loot_score_service_1.LootScoreService();
        this._memberMatcher = new member_match_helper_1.MemberMatchHelper();
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
    createMinifiedSeniorityMap(minifiedAttendanceMap, seniorityLogChannel, guildMembers, appSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            let seniorityMap = yield this._lootScoreService.getSeniorityMap(seniorityLogChannel);
            for (let entry of seniorityMap) {
                let member = this._memberMatcher.matchMemberFromId(guildMembers, entry[0]);
                if (member && member instanceof discord_js_1.GuildMember) {
                    if (this.memberShouldBeTracked(member, appSettings)) {
                        seniorityMap.set(entry[0], seniorityMap.get(entry[0]) + 1);
                    }
                    else {
                        seniorityMap.delete(entry[0]);
                    }
                }
                else {
                    seniorityMap.delete(entry[0]);
                }
            }
            for (let entry of minifiedAttendanceMap) {
                if (!seniorityMap.get(entry[0])) {
                    seniorityMap.set(entry[0], 1);
                }
            }
            return seniorityMap;
        });
    }
    startLogging(message, raidChannel1, raidChannel2, appSettings) {
        this.loggingInProgress = true;
        message.channel.send('Starting attendance log. Make sure you are in the raid channel.');
        message.channel.send('*Don\'t fret. There is a 5 minute grace period at beginning and end.*');
        message.channel.send(':snail:');
        this._timerSubscription = rxjs_1.timer(0, 60000).subscribe(() => {
            this._tick++;
            if (Array.from(raidChannel1.members.values())) {
                if (Array.from(raidChannel2.members.values()).length > 0) {
                    var memberArray = Array.from(raidChannel1.members.values())
                        .concat(Array.from(raidChannel2.members.values())).filter((member) => this.memberShouldBeTracked(member, appSettings));
                    var uniqueArray = memberArray.filter((member, index, self) => index === self.findIndex((m) => (m.id === member.id)));
                    this.attendanceLog.set(this._tick, uniqueArray);
                }
                else {
                    this.attendanceLog.set(this._tick, Array.from(raidChannel1.members.values()).filter((member) => this.memberShouldBeTracked(member, appSettings)));
                }
            }
            else {
                this.attendanceLog.set(this._tick, Array.from(raidChannel1.members.values()).filter((member) => this.memberShouldBeTracked(member, appSettings)));
            }
        });
    }
    endLogging(message, seniorityLogChannel, attendanceLogChannel, attendanceLogReadableChannel, guildMembers, appSettings, saveValues, updateDump) {
        return __awaiter(this, void 0, void 0, function* () {
            if (saveValues) {
                let attendanceArray = Array.from(this.attendanceLog.entries());
                if (attendanceArray.length > 10) {
                    attendanceArray = attendanceArray.slice(5, attendanceArray.length - 5);
                }
                let modifiedAttendanceLog = new Map();
                for (let entry of attendanceArray) {
                    modifiedAttendanceLog.set(entry[0], entry[1]);
                }
                const minifiedAttendanceMap = this.createMinifiedAttendanceMap(modifiedAttendanceLog);
                const readableMinifiedAttendanceMap = this.createReadableMinifiedAttendanceMap(modifiedAttendanceLog);
                const minifiedAttendanceArray = Array.from(minifiedAttendanceMap.entries());
                let attendanceLootScoreData = this._dataHelper.createLootScoreData(minifiedAttendanceArray, message);
                attendanceLogChannel.send(this.codeBlockify(JSON.stringify(attendanceLootScoreData)));
                attendanceLogReadableChannel.send(new attendance_embed_1.AttendanceEmbed(readableMinifiedAttendanceMap));
                if (seniorityLogChannel) {
                    const minifiedSeniorityMap = yield this.createMinifiedSeniorityMap(minifiedAttendanceMap, seniorityLogChannel, guildMembers, appSettings);
                    const minifiedSeniorityArray = Array.from(minifiedSeniorityMap.entries());
                    let seniorityLootScoreData = this._dataHelper.createLootScoreData(minifiedSeniorityArray, message);
                    seniorityLogChannel.send(this.codeBlockify(JSON.stringify(seniorityLootScoreData)));
                }
                if (this._tick === 1) {
                    message.channel.send(`Attendance saved. Total duration: ${this._tick} minute`);
                }
                else {
                    message.channel.send(`Attendance saved. Total duration: ${this._tick} minutes`);
                }
                if (updateDump) {
                    updateDump();
                }
            }
            this._tick = 0;
            this._timerSubscription.unsubscribe();
            this.loggingInProgress = false;
            this.attendanceLog = new Map();
        });
    }
    codeBlockify(string) {
        return '```' + string + '```';
    }
    memberShouldBeTracked(member, appSettings) {
        if (member.roles.array().length > 0) {
            if (member.roles.array().find((x) => x.id === appSettings['applicant']) || member.roles.array().find((x) => x.id === appSettings['raider']) || member.roles.array().find((x) => x.id === appSettings['leadership'])) {
                return true;
            }
        }
    }
}
exports.AttendanceService = AttendanceService;
