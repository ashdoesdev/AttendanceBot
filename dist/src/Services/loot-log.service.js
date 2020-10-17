"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
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
    awardItem(message, lootLogChannel, lootLogReadableChannel, item, member, offspec = false, existing = false, flags, callback) {
        let awardedItem = new item_score_model_1.AwardedItem();
        awardedItem.member = new loot_score_model_1.MinimalMember();
        awardedItem.member.displayName = member.displayName;
        awardedItem.member.id = member.id;
        awardedItem.item = item;
        awardedItem.offspec = offspec;
        awardedItem.flags = flags;
        awardedItem.existing = existing;
        if (existing) {
            awardedItem.item.score = 0;
        }
        let lootScoreData = this._dataHelper.createLootScoreData(awardedItem, message);
        lootLogChannel.send(this.codeBlockify(JSON.stringify(lootScoreData)));
        lootLogReadableChannel.send(new loot_log_embed_1.LootLogEmbed(lootScoreData));
        callback(lootScoreData);
        let extras = '';
        if (existing) {
            extras = ' (existing)';
        }
        else if (offspec) {
            extras = ' (offspec)';
        }
        message.channel.send(`Awarded ${member.displayName} **${item.displayName}**${extras}.`);
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
    getEligibleMembers(item, lootLogMap, members) {
        return __awaiter(this, void 0, void 0, function* () {
            let memberLootHistory = new Array();
            let eligibleMembers = new Array();
            lootLogMap.forEach((key, value) => {
                for (let looted of key) {
                    if (looted.value.item) {
                        if (looted.value.item.displayName === item.displayName) {
                            if (value) {
                                memberLootHistory.push(value.id);
                            }
                        }
                    }
                }
            });
            members.forEach((member) => {
                if (member instanceof discord_js_1.GuildMember) {
                    if (!memberLootHistory.find((x) => x === member.id)) {
                        let roles = new Array();
                        for (let role of member.roles.array()) {
                            roles.push(role.name.toLowerCase());
                        }
                        if (item) {
                            if (item.eligibleClasses) {
                                if (roles.filter((x) => item.eligibleClasses.map(item => item.toLowerCase()).includes(x)).length > 0) {
                                    if (member) {
                                        eligibleMembers.push(member.id);
                                    }
                                }
                            }
                        }
                    }
                }
            });
            return eligibleMembers;
        });
    }
    getHasLooted(item, lootLogMap, members) {
        return __awaiter(this, void 0, void 0, function* () {
            let memberLootHistory = new Array();
            let hasLooted = new Array();
            lootLogMap.forEach((key, value) => {
                for (let looted of key) {
                    if (looted.value.item) {
                        if (looted.value.item.displayName === item.displayName) {
                            if (value) {
                                memberLootHistory.push(value.id);
                            }
                        }
                    }
                }
            });
            members.forEach((member) => {
                if (memberLootHistory.find((x) => x === member.id)) {
                    if (member) {
                        hasLooted.push(member.id);
                    }
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
                let minimalMember = new loot_score_model_1.MinimalMember();
                let entries;
                let existingKey;
                if (lootLogEntry.member) {
                    if (lootLogEntry.member.id) {
                        member = this._memberMatcher.matchMemberFromId(members, lootLogEntry.member.id);
                        if (!member) {
                            minimalMember.displayName = lootLogEntry.member.displayName;
                            minimalMember.id = lootLogEntry.member.id;
                            const getMapValue = (m, key) => {
                                return m.get(Array.from(m.keys()).filter((entry) => !(entry instanceof discord_js_1.GuildMember)).find((k) => JSON.stringify(k) === JSON.stringify(key)));
                            };
                            entries = getMapValue(lootLogMap, minimalMember);
                            if (entries) {
                                const getMapKey = Array.from(lootLogMap.keys()).filter((entry) => !(entry instanceof discord_js_1.GuildMember)).find((key) => JSON.stringify(key) === JSON.stringify(minimalMember));
                                existingKey = getMapKey;
                            }
                        }
                        else {
                            entries = lootLogMap.get(member);
                        }
                    }
                }
                if (entries) {
                    if (member) {
                        lootLogMap.set(member, entries.concat(lootScoreData));
                    }
                    else if (minimalMember) {
                        lootLogMap.set(existingKey, entries.concat(lootScoreData));
                    }
                }
                else {
                    if (member) {
                        lootLogMap.set(member, [lootScoreData]);
                    }
                    else if (minimalMember) {
                        lootLogMap.set(minimalMember, [lootScoreData]);
                    }
                }
            }
            return lootLogMap;
        });
    }
    getLootHistory(member, lootLogMap, members) {
        return __awaiter(this, void 0, void 0, function* () {
            if (member instanceof discord_js_1.GuildMember) {
                return lootLogMap.get(member);
            }
            else {
                const getMapValue = (m, key) => {
                    return m.get(Array.from(m.keys()).filter((entry) => !(entry instanceof discord_js_1.GuildMember)).find((k) => JSON.stringify(k) === JSON.stringify(key)));
                };
                return getMapValue(lootLogMap, member);
            }
        });
    }
    getFullLootHistory(lootLogChannel, members) {
        return __awaiter(this, void 0, void 0, function* () {
            let lootLogMap = yield this.createLootLogMap(lootLogChannel, members);
            let allItemsLooted = new Array();
            for (let entry of lootLogMap) {
                if (entry[1]) {
                    allItemsLooted.push(...entry[1]);
                }
            }
            return allItemsLooted;
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
