"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LootScore {
}
exports.LootScore = LootScore;
class MemberScore {
    get lootScore() {
        let lootScore = 100;
        if (this.attendanceTotal) {
            lootScore += this.attendanceTotal;
        }
        if (this.itemScoreTotal) {
            lootScore -= this.itemScoreTotal;
        }
        if (this.attendanceTotal > 48) {
            if (lootScore > 0) {
                lootScore += lootScore * .1;
            }
            else {
                lootScore += lootScore * -.1;
            }
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
