"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MemberMatchHelper {
    replaceMemberIdWithMember(members, map) {
        let memberMap = new Map();
        for (let entry of map) {
            const member = members.find((x) => x.id === entry[0]);
            if (member) {
                memberMap.set(member, entry[1]);
            }
        }
        return memberMap;
    }
    matchMemberFromId(members, memberId) {
        return members.find((x) => x.id === memberId);
    }
    matchMemberFromName(members, displayName) {
        return members.find((x) => x.displayName.toLowerCase() === displayName.toLowerCase());
    }
}
exports.MemberMatchHelper = MemberMatchHelper;
