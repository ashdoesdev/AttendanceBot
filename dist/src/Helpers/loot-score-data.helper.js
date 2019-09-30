"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loot_score_model_1 = require("../Models/loot-score.model");
class LootScoreDataHelper {
    createLootScoreData(value, message) {
        let data = new loot_score_model_1.LootScoreData();
        data.value = value;
        data.signature = new loot_score_model_1.Signature();
        data.signature.requester = new loot_score_model_1.MinimalMember();
        data.signature.requester.id = message.member.id;
        data.signature.requester.displayName = message.member.displayName;
        data.signature.timestamp = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' });
        return data;
    }
}
exports.LootScoreDataHelper = LootScoreDataHelper;
