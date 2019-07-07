"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MemberMatchHelper {
    replaceMemberIdWithMember(members, map) {
        for (let entry of map) {
            const member = members.find((x) => x.id === entry[0]);
            if (member) {
                if (!map.has(member)) {
                    map.set(member, entry[1]);
                    map.delete(entry[0]);
                }
            }
        }
        return map;
    }
    matchMemberFromId(members, memberId) {
        return members.find((x) => x.id === memberId);
    }
}
exports.MemberMatchHelper = MemberMatchHelper;
