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
const loot_log_service_1 = require("../Services/loot-log.service");
const map_sort_helper_1 = require("./map-sort.helper");
class StatsHelper {
    constructor() {
        this._lootLogService = new loot_log_service_1.LootLogService();
        this._mapSort = new map_sort_helper_1.MapSortHelper();
    }
    getAverageAttendance(lootScoreMap, activeMembers) {
        let memberCount = 0;
        let attendanceCount = 0;
        let filteredMap = this._mapSort.filterMembers(lootScoreMap, activeMembers);
        for (let entry of filteredMap) {
            memberCount++;
            attendanceCount += entry[1].attendancePercentage;
        }
        return attendanceCount / memberCount;
    }
    getAverageSeniority(lootScoreMap, activeMembers) {
        let memberCount = 0;
        let seniorityCount = 0;
        let filteredMap = this._mapSort.filterMembers(lootScoreMap, activeMembers);
        for (let entry of filteredMap) {
            memberCount++;
            seniorityCount += entry[1].seniorityPercentage;
        }
        return seniorityCount / memberCount;
    }
    orderLootedItemsByCount(lootScoreMap, lootLogChannel, members) {
        return __awaiter(this, void 0, void 0, function* () {
            let allItemsAwarded = new Array();
            for (let entry of lootScoreMap) {
                let itemsLooted = yield this._lootLogService.getLootHistory(entry[0], lootLogChannel, members);
                allItemsAwarded.push(...itemsLooted);
            }
            let simplifiedItems = new Array();
            for (let item of allItemsAwarded) {
                simplifiedItems.push(item.value.item.displayName);
            }
            let frequenciesMap = this.getFrequenciesMap(simplifiedItems);
            let sortedMap = this._mapSort.sortFrequenciesMap(frequenciesMap);
            return sortedMap;
        });
    }
    getFrequenciesMap(array) {
        return new Map([...new Set(array)].map(x => [x, array.filter(y => y === x).length]));
    }
}
exports.StatsHelper = StatsHelper;
