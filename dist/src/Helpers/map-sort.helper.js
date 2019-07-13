"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MapSortHelper {
    sortByAttendance(lootScoreMap, ascending) {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => a[1].attendancePercentage - b[1].attendancePercentage);
        }
        else {
            array.sort((a, b) => b[1].attendancePercentage - a[1].attendancePercentage);
        }
        return new Map(array);
    }
    sortByItemScoreTotal(lootScoreMap, ascending) {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => a[1].itemScoreTotal - b[1].itemScoreTotal);
        }
        else {
            array.sort((a, b) => b[1].itemScoreTotal - a[1].itemScoreTotal);
        }
        return new Map(array);
    }
    sortByLootScore(lootScoreMap, ascending) {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => a[1].lootScore - b[1].lootScore);
        }
        else {
            array.sort((a, b) => b[1].lootScore - a[1].lootScore);
        }
        return new Map(array);
    }
    sortBySeniority(lootScoreMap, ascending) {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => a[1].seniorityPercentage - b[1].seniorityPercentage);
        }
        else {
            array.sort((a, b) => b[1].seniorityPercentage - a[1].seniorityPercentage);
        }
        return new Map(array);
    }
    sortByName(lootScoreMap, ascending) {
        const array = Array.from(lootScoreMap);
        if (ascending) {
            array.sort((a, b) => b[0].displayName.localeCompare(a[0].displayName));
        }
        else {
            array.sort((a, b) => a[0].displayName.localeCompare(b[0].displayName));
        }
        return new Map(array);
    }
    sortByDistance(relatedTermsMap, ascending) {
        const array = Array.from(relatedTermsMap);
        if (ascending) {
            array.sort((a, b) => b[1] - a[1]);
        }
        else {
            array.sort((a, b) => a[1] - b[1]);
        }
        return new Map(array);
    }
    filterMembers(lootScoreMap, members) {
        const array = Array.from(lootScoreMap);
        let filteredArray = array.filter((value) => members.includes(value[0].id));
        return new Map(filteredArray);
    }
}
exports.MapSortHelper = MapSortHelper;
