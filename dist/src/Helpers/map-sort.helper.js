"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MapSortHelper {
    sortByAttendance(lootScoreMap) {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].attendancePercentage - a[1].attendancePercentage);
        return new Map(array);
    }
    sortByItemScoreTotal(lootScoreMap) {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => a[1].itemScoreTotal - b[1].itemScoreTotal);
        return new Map(array);
    }
    sortByItemScoreOffspecTotal(lootScoreMap) {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => a[1].itemScoreOffspecTotal - b[1].itemScoreOffspecTotal);
        return new Map(array);
    }
    sortByLastLootDate(lootScoreMap) {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => {
            var dateA = new Date(a[1].lastLootDate).getTime();
            var dateB = new Date(b[1].lastLootDate).getTime();
            return dateA - dateB;
        });
        return new Map(array);
    }
    sortBySeniority(lootScoreMap) {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].seniorityPercentage - a[1].seniorityPercentage);
        return new Map(array);
    }
    sortByName(lootScoreMap) {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => a[0].displayName.localeCompare(b[0].displayName));
        return new Map(array);
    }
    filterMembers(lootScoreMap, members) {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => members.includes(value[0].id));
        return new Map(filteredArray);
    }
    sortByFlag(lootScoreMap, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate) {
        if (orderByName) {
            return this.sortByName(lootScoreMap);
        }
        if (orderByAttendance) {
            return this.sortByAttendance(lootScoreMap);
        }
        if (orderBySeniority) {
            return this.sortBySeniority(lootScoreMap);
        }
        if (orderByOffspecItemScore) {
            return this.sortByItemScoreOffspecTotal(lootScoreMap);
        }
        if (orderByLastLootDate) {
            return this.sortByLastLootDate(lootScoreMap);
        }
        return this.sortByItemScoreTotal(lootScoreMap);
    }
}
exports.MapSortHelper = MapSortHelper;
