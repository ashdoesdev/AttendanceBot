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
const map_sort_helper_1 = require("../Helpers/map-sort.helper");
const loot_score_model_1 = require("../Models/loot-score.model");
class LootScoreService {
    constructor() {
        this._mapSort = new map_sort_helper_1.MapSortHelper();
    }
    getAttendanceEntries(attendanceLogChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = new Array();
            let lastId;
            while (true) {
                const options = { limit: 100 };
                const messages = yield attendanceLogChannel.fetchMessages(options);
                entries.push(...messages.array());
                lastId = messages.last().id;
                if (messages.size != 100) {
                    break;
                }
            }
            this.totalRaids = entries.length;
            return entries;
        });
    }
    getAttendanceMap(attendanceLogChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = yield this.getAttendanceEntries(attendanceLogChannel);
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
    getSeniorityEntries(seniorityLogChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = new Array();
            let lastId;
            while (true) {
                const options = { limit: 100 };
                const messages = yield seniorityLogChannel.fetchMessages(options);
                entries.push(...messages.array());
                if (messages.last()) {
                    lastId = messages.last().id;
                }
                if (messages.size != 100) {
                    break;
                }
            }
            return entries;
        });
    }
    getSeniorityMap(seniorityLogChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = yield this.getSeniorityEntries(seniorityLogChannel);
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
    getAttendancePercentageMap(attendanceMap) {
        let percentageMap = new Map();
        for (let entry of attendanceMap) {
            let sum = entry[1].reduce(function (a, b) { return a + b; });
            let avg = sum / entry[1].length;
            percentageMap.set(entry[0], avg);
        }
        return percentageMap;
    }
    createLootScoreMap(attendanceMap, seniorityMap, lootLogMap) {
        let lootScoreMap = new Map();
        for (let entry of attendanceMap) {
            const memberScore = new loot_score_model_1.MemberScore();
            memberScore.attendancePercentage = Math.ceil(entry[1]);
            lootScoreMap.set(entry[0], memberScore);
        }
        let highestValue = 1;
        for (let entry of seniorityMap) {
            if (entry[1] > highestValue) {
                highestValue = entry[1];
            }
        }
        for (let entry of seniorityMap) {
            let memberScore = lootScoreMap.get(entry[0]);
            memberScore.seniorityPercentage = Math.round((entry[1] / highestValue) * 100);
            lootScoreMap.set(entry[0], memberScore);
        }
        for (let entry of lootLogMap) {
            let memberScore = lootScoreMap.get(entry[0]);
            let total = 0;
            for (let item of entry[1]) {
                total += item.score;
            }
            memberScore.itemScoreTotal = total;
        }
        let sortedMap = this._mapSort.sortByItemScoreTotal(lootScoreMap);
        let highestItemScore = Array.from(sortedMap)[0][1].itemScoreTotal;
        for (let entry of lootScoreMap) {
            let memberScore = lootScoreMap.get(entry[0]);
            if (memberScore.itemScoreTotal) {
                memberScore.itemScorePercentage = Math.round((memberScore.itemScoreTotal / highestItemScore) * 100);
            }
            else {
                memberScore.itemScorePercentage = 0;
            }
        }
        return lootScoreMap;
    }
}
exports.LootScoreService = LootScoreService;
