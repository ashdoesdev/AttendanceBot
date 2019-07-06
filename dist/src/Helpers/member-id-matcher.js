"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MemberIdMatcher {
    replaceMemberIdWithMember(members, map) {
        for (let entry of map) {
            const member = members.find((x) => x.id === entry[0]);
            if (!map.has(member)) {
                map.set(member, entry[1]);
                map.delete(entry[0]);
            }
        }
        return map;
    }
}
exports.MemberIdMatcher = MemberIdMatcher;
