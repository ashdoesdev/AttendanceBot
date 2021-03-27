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
const AttendanceData_1 = require("../Models/AttendanceData");
const messages_helper_1 = require("../Helpers/messages.helper");
class AttendanceDataService {
    constructor() {
        this._messages = new messages_helper_1.MessagesHelper();
    }
    getAttendanceMap(attendanceLogChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = yield this._messages.getMessages(attendanceLogChannel);
            let allEntries = new Map();
            for (let entry of entries) {
                let endIndex = entry.content.length - 4;
                let cleanString = entry.content.replace(/`/g, '');
                if (cleanString.length > 0) {
                    let lootScoreData = JSON.parse(cleanString);
                    for (let x of lootScoreData.value) {
                        if (!allEntries.has(x[0])) {
                            let array = new Array();
                            array.push(x[1]);
                            allEntries.set(x[0], array);
                        }
                        else {
                            let array = allEntries.get(x[0]);
                            array.push(x[1]);
                            allEntries.set(x[0], array);
                        }
                    }
                }
            }
            return allEntries;
        });
    }
    getSeniorityMap(seniorityLogChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = yield this._messages.getMessages(seniorityLogChannel);
            let lastEntry = entries[0];
            let seniorityMap = new Map();
            if (lastEntry) {
                let endIndex = lastEntry.content.length - 4;
                let cleanString = lastEntry.content.replace(/`/g, '');
                if (cleanString.length > 0) {
                    let lootScoreData = JSON.parse(cleanString);
                    for (let x of lootScoreData.value) {
                        seniorityMap.set(x[0], x[1]);
                    }
                }
            }
            return seniorityMap;
        });
    }
    createAttendanceDataMap(attendanceMap, seniorityMap) {
        let attendanceDataMap = new Map();
        for (let entry of attendanceMap) {
            let memberScore = attendanceDataMap.get(entry[0]);
            if (!memberScore) {
                memberScore = new AttendanceData_1.MemberAttendance();
            }
            let raidCountExpected = seniorityMap.get(entry[0]);
            let sum = entry[1].reduce(function (a, b) { return a + b; });
            let avg = sum / raidCountExpected || 0;
            memberScore.attendancePercentage = Math.round(avg);
            attendanceDataMap.set(entry[0], memberScore);
        }
        let highestValue = 1;
        for (let entry of seniorityMap) {
            if (entry[1] > highestValue) {
                highestValue = entry[1];
            }
        }
        for (let entry of seniorityMap) {
            let memberScore = attendanceDataMap.get(entry[0]);
            if (!memberScore) {
                memberScore = new AttendanceData_1.MemberAttendance();
            }
            var seniority = Math.round((entry[1] / 50) * 100);
            if (seniority > 100) {
                seniority = 100;
            }
            memberScore.seniorityPercentage = seniority;
            attendanceDataMap.set(entry[0], memberScore);
        }
        return attendanceDataMap;
    }
}
exports.AttendanceDataService = AttendanceDataService;