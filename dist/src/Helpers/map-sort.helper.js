"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MapSortHelper {
    sortByAttendance(lootScoreMap) {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].attendancePercentage - a[1].attendancePercentage);
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
    filterOutMembers(lootScoreMap, members) {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => !members.includes(value[0].id));
        return new Map(filteredArray);
    }
}
exports.MapSortHelper = MapSortHelper;
