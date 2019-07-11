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
        array.sort((a, b) => b[1].itemScoreTotal - a[1].itemScoreTotal);
        return new Map(array);
    }
    sortByLootScore(lootScoreMap) {
        const array = Array.from(lootScoreMap);
        array.sort((a, b) => b[1].lootScore - a[1].lootScore);
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
    sortByDistance(relatedTermsMap) {
        const array = Array.from(relatedTermsMap);
        array.sort((a, b) => a[1] - b[1]);
        return new Map(array);
    }
    filterMembers(lootScoreMap, members) {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => members.includes(value[0].id));
        return new Map(filteredArray);
    }
}
exports.MapSortHelper = MapSortHelper;
