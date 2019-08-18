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
const loot_score_model_1 = require("../Models/loot-score.model");
const member_match_helper_1 = require("../Helpers/member-match.helper");
const loot_score_data_helper_1 = require("../Helpers/loot-score-data.helper");
const messages_helper_1 = require("../Helpers/messages.helper");
class LootLogService {
    constructor() {
        this._memberMatcher = new member_match_helper_1.MemberMatchHelper();
        this._dataHelper = new loot_score_data_helper_1.LootScoreDataHelper();
        this._messages = new messages_helper_1.MessagesHelper();
    }
    awardItem(message, lootLogChannel, lootLogReadableChannel, item, member, offspec = false) {
        let awardedItem = new item_score_model_1.AwardedItem();
        awardedItem.member = new loot_score_model_1.MinimalMember();
        awardedItem.member.displayName = member.displayName;
        awardedItem.member.id = member.id;
        awardedItem.item = item;
        awardedItem.offspec = offspec;
        if (offspec) {
            awardedItem.item.score = awardedItem.item.score * .25;
        }
        let lootScoreData = this._dataHelper.createLootScoreData(awardedItem, message);
        lootLogChannel.send(this.codeBlockify(JSON.stringify(lootScoreData)));
        lootLogReadableChannel.send(new loot_log_embed_1.LootLogEmbed(item, member.displayName, message.member.displayName));
        if (offspec) {
            message.channel.send(`Awarded ${member.displayName} **${item.displayName}** (offspec).`);
        }
        else {
            message.channel.send(`Awarded ${member.displayName} **${item.displayName}**.`);
        }
    }
    getItemScores(itemScoresChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            let entries = yield this._messages.getMessages(itemScoresChannel);
            let scores = new Array();
            for (let entry of entries) {
                let array = this.convertStringPipesToArray(entry.content);
                let itemScore = new item_score_model_1.ItemScore();
                itemScore.displayName = array[0];
                itemScore.shorthand = array[1];
                itemScore.score = parseFloat(array[2]);
                let eligibleClasses = array[3];
                if (eligibleClasses) {
                    itemScore.eligibleClasses = eligibleClasses.split(',').map((x) => x.trim());
                }
                scores.push(itemScore);
            }
            return scores;
        });
    }
    getEligibleMembers(item, lootLogChannel, presentMembers) {
        return __awaiter(this, void 0, void 0, function* () {
            let lootLogMap = yield this.createLootLogMap(lootLogChannel, presentMembers);
            let memberLootHistory = new Array();
            let eligibleMembers = new Array();
            lootLogMap.forEach((key, value) => {
                for (let looted of key) {
                    if (looted.value.item) {
                        if (looted.value.item.displayName === item.displayName) {
                            memberLootHistory.push(value.id);
                        }
                    }
                }
            });
            presentMembers.forEach((member) => {
                if (!memberLootHistory.find((x) => x === member.id)) {
                    let roles = new Array();
                    for (let role of member.roles.array()) {
                        roles.push(role.name.toLowerCase());
                    }
                    if (item) {
                        if (item.eligibleClasses) {
                            if (roles.filter((x) => item.eligibleClasses.includes(x)).length > 0) {
                                eligibleMembers.push(member.id);
                            }
                        }
                    }
                }
            });
            return eligibleMembers;
        });
    }
    getHasLooted(item, lootLogChannel, presentMembers) {
        return __awaiter(this, void 0, void 0, function* () {
            let lootLogMap = yield this.createLootLogMap(lootLogChannel, presentMembers);
            let memberLootHistory = new Array();
            let hasLooted = new Array();
            lootLogMap.forEach((key, value) => {
                for (let looted of key) {
                    if (looted.value.item) {
                        if (looted.value.item.displayName === item.displayName) {
                            memberLootHistory.push(value.id);
                        }
                    }
                }
            });
            presentMembers.forEach((member) => {
                if (memberLootHistory.find((x) => x === member.id)) {
                    hasLooted.push(member.id);
                }
            });
            return hasLooted;
        });
    }
    createLootLogMap(lootLogChannel, members) {
        return __awaiter(this, void 0, void 0, function* () {
            let messageEntries = yield this._messages.getMessages(lootLogChannel);
            let lootLogMap = new Map();
            for (let entry of messageEntries) {
                let cleanString = entry.content.replace(/`/g, '');
                let lootScoreData = JSON.parse(cleanString);
                let lootLogEntry = lootScoreData.value;
                let member;
                let entries;
                if (lootLogEntry.member.id) {
                    member = this._memberMatcher.matchMemberFromId(members, lootLogEntry.member.id);
                    entries = lootLogMap.get(member);
                }
                if (entries) {
                    lootLogMap.set(member, entries.concat(lootScoreData));
                }
                else {
                    lootLogMap.set(member, [lootScoreData]);
                }
            }
            return lootLogMap;
        });
    }
    getLootHistory(member, lootLogChannel, members) {
        return __awaiter(this, void 0, void 0, function* () {
            let lootLogMap = yield this.createLootLogMap(lootLogChannel, members);
            return lootLogMap.get(member);
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
