"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LootScore {
}
exports.LootScore = LootScore;
class MemberScore {
    get lootScore() {
        return this.attendancePercentage + this.seniorityPercentage;
    }
}
exports.MemberScore = MemberScore;
class LootScoreData {
}
exports.LootScoreData = LootScoreData;
class Signature {
}
exports.Signature = Signature;
class MinimalMember {
}
exports.MinimalMember = MinimalMember;
