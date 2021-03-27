"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const map_sort_helper_1 = require("./map-sort.helper");
class StatsHelper {
    constructor() {
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
    getFrequenciesMap(array) {
        return new Map([...new Set(array)].map(x => [x, array.filter(y => y === x).length]));
    }
}
exports.StatsHelper = StatsHelper;
