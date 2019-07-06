"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const item_score_model_1 = require("../Models/item-score.model");
const loot_log_embed_1 = require("../Embeds/loot-log.embed");
class LootLogService {
    awardItem(message, lootLogChannel, lootLogReadableChannel, item) {
        let map = new Map();
        map.set(message.mentions.members.array()[0].id, item);
        lootLogChannel.send(this.codeBlockify(JSON.stringify(Array.from(map.entries()))));
        lootLogReadableChannel.send(new loot_log_embed_1.LootLogEmbed(item, message.mentions.members.array()[0].displayName));
        message.channel.send(`Awarded ${message.mentions.members.array()[0].displayName} **${item.displayName}** (${item.score}).`);
    }
    getItemScores(itemScoresChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = yield this.getItemScoreEntries(itemScoresChannel);
            let scores = new Array();
            for (let entry of entries) {
                let array = this.convertStringPipesToArray(entry.content);
                let itemScore = new item_score_model_1.ItemScore();
                itemScore.displayName = array[0];
                itemScore.shorthand = array[1];
                itemScore.score = parseFloat(array[2]);
                scores.push(itemScore);
            }
            return scores;
        });
    }
    getItemScoreEntries(itemScoresChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = new Array();
            let lastId;
            while (true) {
                const options = { limit: 100 };
                const messages = yield itemScoresChannel.fetchMessages(options);
                entries.push(...messages.array());
                lastId = messages.last().id;
                if (messages.size != 100) {
                    break;
                }
            }
            return entries;
        });
    }
    convertStringPipesToArray(string) {
        let array = string.split('|');
        let trimmedArray = array.map(s => s.trim());
        return trimmedArray;
    }
    codeBlockify(string) {
        return '```' + string + '```';
    }
}
exports.LootLogService = LootLogService;
