"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LootScore {
}
exports.LootScore = LootScore;
class MemberScore {
    get lootScore() {
        let lootScore = this.attendancePercentage + this.seniorityPercentage;
        if (this.itemScorePercentage > 0) {
            lootScore -= this.itemScorePercentage / 4;
        }
        return Math.round(lootScore);
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
