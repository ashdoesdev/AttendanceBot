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
const csv = require("csv-parser");
const discord_js_1 = require("discord.js");
const fs = require("fs");
const stringSimilarity = require("string-similarity");
const heading_embed_1 = require("./Embeds/heading.embed");
const help_embed_1 = require("./Embeds/help.embed");
const items_looted_embed_1 = require("./Embeds/items-looted.embed");
const minimal_visualization_embed_1 = require("./Embeds/minimal-visualization.embed");
const seniority_embed_1 = require("./Embeds/seniority.embed");
const map_sort_helper_1 = require("./Helpers/map-sort.helper");
const member_match_helper_1 = require("./Helpers/member-match.helper");
const messages_helper_1 = require("./Helpers/messages.helper");
const attendance_service_1 = require("./Services/attendance.service");
const loot_log_service_1 = require("./Services/loot-log.service");
const loot_score_service_1 = require("./Services/loot-score.service");
const timestamp_helper_1 = require("./Helpers/timestamp.helper");
const stats_embed_1 = require("./Embeds/stats.embed");
const last_raid_loot_embed_1 = require("./Embeds/last-raid-loot.embed");
const last_raid_attendance_embed_1 = require("./Embeds/last-raid-attendance.embed");
const items_looted_expanded_embed_1 = require("./Embeds/items-looted-expanded.embed");
class RaidBot {
    constructor() {
        this._client = new discord_js_1.Client();
        this._lootScoreService = new loot_score_service_1.LootScoreService();
        this._lootLogService = new loot_log_service_1.LootLogService();
        this._attendanceService = new attendance_service_1.AttendanceService();
        this._memberMatcher = new member_match_helper_1.MemberMatchHelper();
        this._mapSort = new map_sort_helper_1.MapSortHelper();
        this._messages = new messages_helper_1.MessagesHelper();
        this._timestamp = new timestamp_helper_1.TimestampHelper();
    }
    start(appSettings) {
        this._appSettings = appSettings;
        this._client.login(appSettings["token"]);
        this._client.once('ready', () => {
            console.log('Ready!');
            this._raidChannel1 = this._client.channels.get(appSettings['raidChannel1']);
            this._raidChannel2 = this._client.channels.get(appSettings['raidChannel2']);
            this._seniorityLogDataChannel = this._client.channels.get(appSettings['seniorityLogDataChannel']);
            this._attendanceLogDataChannel = this._client.channels.get(appSettings['attendanceLogDataChannel']);
            this._attendanceLogChannel = this._client.channels.get(appSettings['attendanceLogChannel']);
            this._lootLogDataChannel = this._client.channels.get(appSettings['lootLogDataChannel']);
            this._lootLogChannel = this._client.channels.get(appSettings['lootLogChannel']);
            this._itemScoresChannel = this._client.channels.get(appSettings['itemScoresChannel']);
            this._lootScoreDailyDumpChannel = this._client.channels.get(appSettings['lootScoreDailyDumpChannel']);
            this._adminChannel = this._client.channels.get(appSettings['adminChannel']);
            this._feedChannel = this._client.channels.get(appSettings['feedChannel']);
            var CronJob = require('cron').CronJob;
            var job = new CronJob('00 00 00 * * *', () => {
                this.backUpValues();
            }, null, true, 'America/Los_Angeles');
            job.start();
        });
        this._client.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
            if (message.content === '/help' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                message.author.send(new help_embed_1.HelpEmbed(this._appSettings));
            }
            if (message.content === '/refresh' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this.sendLootScoreDailyDump();
            }
            if (message.content === '/refreshmembers' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                message.channel.send('Refreshed guild members.');
            }
            if ((message.content === '/s' || message.content === '/start') && this.canUseCommands(message) && this.isFeedChannel(message)) {
                if (Array.from(this._raidChannel1.members.values()).length > 0 || Array.from(this._raidChannel2.members.values()).length > 0) {
                    message.channel.send('Do you wish to start logging? Please confirm.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
                        sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                            if (collected.first().emoji.name === '✅') {
                                this._attendanceService.startLogging(message, this._raidChannel1, this._raidChannel2, this._appSettings);
                            }
                            else {
                                message.channel.send('Request to start logging aborted.');
                            }
                        })
                            .catch((err) => {
                            console.log(err);
                            message.channel.send('No reply received. Request to start logging aborted.');
                        });
                    });
                }
                else {
                    message.channel.send('No one is in the raid! Request to start logging aborted.');
                }
            }
            if ((message.content === '/end' || message.content === '/e') && this.canUseCommands(message) && this.isFeedChannel(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
                        sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                            if (collected.first().emoji.name === '✅') {
                                message.channel.send('*Saving attendance . . .*');
                                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                                this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel, this._guildMembers, this._appSettings, true, this.sendLootScoreDailyDump.bind(this));
                            }
                            else {
                                message.channel.send('Request to end logging aborted. Logging will continue.');
                            }
                        })
                            .catch((err) => {
                            console.log(err);
                            message.channel.send('No reply received. Request to end logging aborted. Logging will continue.');
                        });
                    });
                }
                else {
                    message.channel.send(`Did you mean to start attendance first? (Hint: !ls s)`);
                }
            }
            if ((message.content === '/end --nolog' || message.content === '/e --nolog') && this.canUseCommands(message) && this.isFeedChannel(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you sure? This command will end the raid and not save any values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
                        sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                            if (collected.first().emoji.name === '✅') {
                                message.channel.send('Logging successfully ended. No records saved from this session.');
                                this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel, this._guildMembers, this._appSettings, false);
                            }
                            else {
                                message.channel.send('Request to end logging aborted. Logging will continue.');
                            }
                        })
                            .catch((err) => {
                            console.log(err);
                            message.channel.send('No reply received. Request to end logging aborted. Logging will continue.');
                        });
                    });
                }
                else {
                    message.channel.send(`Did you mean to start attendance first? (Hint: !ls -s)`);
                }
            }
            if ((message.content.startsWith('/report') && this.canUseCommands(message) && this.isAdminChannel(message))) {
                yield this.refreshDataMaps();
                let sortedMap = new Map();
                let modifiers = message.content.split(' ').filter((x) => x.startsWith('--'));
                modifiers.forEach((modifier, i) => {
                    modifiers[i] = modifier.slice(2).toLowerCase();
                });
                let classModifiers = modifiers.filter((modifier) => exports.classes.includes(modifier));
                let orderByName = message.content.includes('--name');
                let orderByAttendance = message.content.includes('--attendance');
                let orderBySeniority = message.content.includes('--seniority');
                let orderByOffspecItemScore = message.content.includes('--offspec');
                let orderByLastLootDate = message.content.includes('--lastloot');
                let orderString = 'ordered by ';
                let classString = '';
                let membersOfClass = new Array();
                if (classModifiers.length > 0) {
                    classString += '(showing ';
                    if (classModifiers.length > 0) {
                        for (let i = 0; i < classModifiers.length; i++) {
                            let members = this._guildMembers.filter((x) => x.roles.array().find((role) => role.name.toLowerCase() === classModifiers[i].toLowerCase()));
                            members.forEach((member) => {
                                membersOfClass.push(member.id);
                            });
                            membersOfClass = membersOfClass.concat();
                            if (i === classModifiers.length - 1) {
                                if (i === 0) {
                                    classString += `**${classModifiers[i]}** only)`;
                                }
                                else {
                                    classString += `and **${classModifiers[i]}** only)`;
                                }
                            }
                            else if (i === classModifiers.length - 2) {
                                classString += `**${classModifiers[i]}** `;
                            }
                            else {
                                classString += `**${classModifiers[i]}**, `;
                            }
                        }
                    }
                    if (membersOfClass.length === 0) {
                        classString = '';
                    }
                }
                orderString += orderByOffspecItemScore ? '**offspec ItemScore**' : orderByLastLootDate ? '**last loot date**' : orderByName ? '**name**' : orderByAttendance ? '**attendance**' : orderBySeniority ? '**seniority**' : '**ItemScore**';
                if (message.content.startsWith('/report has')) {
                    if (message.content.match(/"((?:\\.|[^"\\])*)"/)) {
                        let query = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');
                        let itemScores = yield this._lootLogService.getItemScores(this._itemScoresChannel);
                        let item = itemScores.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());
                        if (item) {
                            this.sendHasEmbed(item, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message);
                        }
                        else {
                            let relatedItems = new Array();
                            itemScores.forEach((item) => {
                                var shorthandSimilarity = stringSimilarity.compareTwoStrings(query, item.shorthand);
                                var displayNameSimilarity = stringSimilarity.compareTwoStrings(query, item.displayName);
                                if (shorthandSimilarity > .5 || displayNameSimilarity > .5 || item.displayName.includes(query) || item.shorthand.includes(query)) {
                                    relatedItems.push(item);
                                }
                            });
                            let relatedString = '';
                            if (relatedItems.length > 0) {
                                if (relatedItems.length === 1) {
                                    this.sendHasEmbed(relatedItems[0], orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message);
                                }
                                else {
                                    for (let i = 0; i < relatedItems.length; i++) {
                                        if (i === relatedItems.length - 1) {
                                            if (i === 0) {
                                                relatedString += `**${relatedItems[i].shorthand}** (${relatedItems[i].displayName})`;
                                            }
                                            else {
                                                relatedString += `or **${relatedItems[i].shorthand}** (${relatedItems[i].displayName})`;
                                            }
                                        }
                                        else {
                                            relatedString += `**${relatedItems[i].shorthand}** (${relatedItems[i].displayName}), `;
                                        }
                                    }
                                    message.channel.send(`Did you mean ${relatedString}?`);
                                }
                            }
                            else {
                                message.channel.send('Item does not exist.');
                            }
                        }
                    }
                    else {
                        message.channel.send('Invalid query. Ensure the item name is in quotes.');
                    }
                }
                else if (message.content.startsWith('/report eligible')) {
                    if (message.content.match(/"((?:\\.|[^"\\])*)"/)) {
                        let query = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');
                        let itemScores = yield this._lootLogService.getItemScores(this._itemScoresChannel);
                        let item = itemScores.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());
                        if (item) {
                            this.sendEligibleEmbed(item, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message);
                        }
                        else {
                            let relatedItems = new Array();
                            itemScores.forEach((item) => {
                                var shorthandSimilarity = stringSimilarity.compareTwoStrings(query, item.shorthand);
                                var displayNameSimilarity = stringSimilarity.compareTwoStrings(query, item.displayName);
                                if (shorthandSimilarity > .5 || displayNameSimilarity > .5 || item.displayName.includes(query) || item.shorthand.includes(query)) {
                                    relatedItems.push(item);
                                }
                            });
                            let relatedString = '';
                            if (relatedItems.length > 0) {
                                if (relatedItems.length === 1) {
                                    this.sendEligibleEmbed(relatedItems[0], orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message);
                                }
                                else {
                                    for (let i = 0; i < relatedItems.length; i++) {
                                        if (i === relatedItems.length - 1) {
                                            if (i === 0) {
                                                relatedString += `**${relatedItems[i].shorthand}** (${relatedItems[i].displayName})`;
                                            }
                                            else {
                                                relatedString += `or **${relatedItems[i].shorthand}** (${relatedItems[i].displayName})`;
                                            }
                                        }
                                        else {
                                            relatedString += `**${relatedItems[i].shorthand}** (${relatedItems[i].displayName}), `;
                                        }
                                    }
                                    message.channel.send(`Did you mean ${relatedString}?`);
                                }
                            }
                            else {
                                message.channel.send('Item does not exist.');
                            }
                        }
                    }
                    else {
                        message.channel.send('Invalid query. Ensure the item name is in quotes.');
                    }
                }
                else if (message.content.startsWith('/report "')) {
                    let memberName = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');
                    let member = this._memberMatcher.matchMemberFromName(this._guildMembers, memberName);
                    if (member) {
                        let itemsLooted = yield this._lootLogService.getLootHistory(member, this._lootLogDataChannel, this._guildMembers);
                        const filteredMap = this._mapSort.filterMembers(this._lootScoreMap, [member.id]);
                        if (Array.from(filteredMap).length > 0) {
                            let title = `Single Member Overview`;
                            message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(filteredMap, title, true, true));
                            message.channel.send(new items_looted_expanded_embed_1.ItemsLootedExpandedEmbed(itemsLooted));
                        }
                        else {
                            message.channel.send(`No history found for **${member.displayName}**`);
                        }
                    }
                    else {
                        message.channel.send('Could not find member. Be sure to type the full display name (not case-sensitive).');
                    }
                }
                else {
                    let sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate);
                    let title = `Overview ${orderString} ${classString}`;
                    if (membersOfClass.length > 0) {
                        const filteredMap = this._mapSort.filterMembers(sortedMap, membersOfClass);
                        let mapChunked = this.chunk(Array.from(filteredMap), 15);
                        for (let i = 0; i < mapChunked.length; i++) {
                            let first = i === 0;
                            let last = i === mapChunked.length - 1;
                            message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(mapChunked[i], title, first, last));
                        }
                    }
                    else {
                        let mapChunked = this.chunk(Array.from(sortedMap), 15);
                        for (let i = 0; i < mapChunked.length; i++) {
                            let first = i === 0;
                            let last = i === mapChunked.length - 1;
                            message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(mapChunked[i], title, first, last));
                        }
                    }
                }
            }
            if (message.content === '/lastraid' && (this.isAdminChannel(message) || message.channel.type === 'dm')) {
                yield this.refreshDataMaps();
                let lastAttendance = yield this._messages.getLast(this._attendanceLogDataChannel);
                if (lastAttendance) {
                    let cleanString = lastAttendance.content.replace(/`/g, '');
                    if (cleanString.length > 0) {
                        let attendance = JSON.parse(cleanString);
                        let date = attendance.signature.timestamp.slice(0, 10);
                        let formattedDate = new Date(attendance.signature.timestamp).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' });
                        let lootArray = Array.from(this._lootLogMap.entries());
                        let itemsLooted = new Array();
                        for (let member of lootArray) {
                            for (let item of member[1]) {
                                if (item.signature.timestamp.startsWith(date)) {
                                    itemsLooted.push(item);
                                }
                            }
                        }
                        let itemsLootedChunked = this.chunk(itemsLooted, 15);
                        for (let i = 0; i < itemsLootedChunked.length; i++) {
                            let first = i === 0;
                            let last = i === itemsLootedChunked.length - 1;
                            message.channel.send(new last_raid_loot_embed_1.LastRaidLootEmbed(itemsLootedChunked[i], first, last));
                        }
                        message.channel.send(new last_raid_attendance_embed_1.LastRaidAttendanceEmbed(attendance, this._guildMembers));
                    }
                    else {
                        message.channel.send('Raid not found.');
                    }
                }
                else {
                    message.channel.send('Raid not found.');
                }
            }
            if (message.content === '/stats' && message.channel.type === 'dm') {
                yield this.refreshDataMaps();
                let filteredMap = this._mapSort.filterMembers(this._lootScoreMap, [message.author.id]);
                let member = this._memberMatcher.matchMemberFromId(this._guildMembers, message.author.id);
                let itemsLooted = yield this._lootLogService.getLootHistory(member, this._lootLogDataChannel, this._guildMembers);
                if (Array.from(filteredMap.entries()).length > 0) {
                    message.channel.send(new stats_embed_1.StatsEmbed(Array.from(filteredMap.entries())[0]));
                    message.channel.send(new items_looted_embed_1.ItemsLootedEmbed(itemsLooted));
                }
            }
            if ((message.content.startsWith('/g ') || message.content.startsWith('/give')) && this.canUseCommands(message)) {
                let member;
                let query = '';
                if (this.isFeedChannel(message)) {
                    member = message.mentions.members.array()[0];
                    query = message.content.replace('/give ', '').replace('/g', '').replace(/(@\S+)/, '').replace('--offspec', '').replace('--existing', '').replace('<', '').trim();
                }
                if (this.isAdminChannel(message)) {
                    if (!this._guildMembers) {
                        this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                    }
                    let memberName = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');
                    member = this._memberMatcher.matchMemberFromName(this._guildMembers, memberName);
                    query = message.content.replace('/give ', '').replace('/g', '').replace(memberName, '').replace(/"/g, '').replace('--offspec', '').replace('--existing', '').replace('<', '').trim();
                }
                let offspec = message.content.includes('--offspec');
                let existing = message.content.includes('--existing');
                if (member) {
                    this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                        let item = array.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());
                        if (item) {
                            this.manageAwardMessage(message, member, item, offspec, existing);
                        }
                        else {
                            let relatedItems = new Array();
                            array.forEach((item) => {
                                var shorthandSimilarity = stringSimilarity.compareTwoStrings(query, item.shorthand);
                                var displayNameSimilarity = stringSimilarity.compareTwoStrings(query, item.displayName);
                                if (shorthandSimilarity > .5 || displayNameSimilarity > .5 || item.displayName.includes(query) || item.shorthand.includes(query)) {
                                    relatedItems.push(item);
                                }
                            });
                            let relatedString = '';
                            if (relatedItems.length > 0) {
                                if (relatedItems.length === 1) {
                                    item = relatedItems[0];
                                    this.manageAwardMessage(message, member, item, offspec, existing);
                                }
                                else {
                                    for (let i = 0; i < relatedItems.length; i++) {
                                        if (i === relatedItems.length - 1) {
                                            if (i === 0) {
                                                relatedString += `**${relatedItems[i].shorthand}** (${relatedItems[i].displayName})`;
                                            }
                                            else {
                                                relatedString += `or **${relatedItems[i].shorthand}** (${relatedItems[i].displayName})`;
                                            }
                                        }
                                        else {
                                            relatedString += `**${relatedItems[i].shorthand}** (${relatedItems[i].displayName}), `;
                                        }
                                    }
                                    message.channel.send(`Did you mean ${relatedString}?`);
                                }
                            }
                            else {
                                message.channel.send('Item does not exist.');
                            }
                        }
                    });
                }
                else {
                    if (this.isFeedChannel(message)) {
                        message.channel.send('Could not find member. Be sure to use a @mention.');
                    }
                    if (this.isAdminChannel(message)) {
                        message.channel.send('Could not find member. Be sure to use quotes around the member name when requesting in the admin channel.');
                    }
                }
            }
            if (message.content.startsWith('/getitemscores') && this.canUseCommands(message) && this.isItemScoresChannel(message)) {
                const path = message.content.replace('/getitemscores ', '');
                const results = [];
                fs.createReadStream(path)
                    .pipe(csv({ headers: false }))
                    .on('data', (data) => results.push(data))
                    .on('error', () => {
                    message.channel.send('File not found.');
                })
                    .on('end', () => {
                    for (let result of results) {
                        if (result[3]) {
                            this._itemScoresChannel.send(`${result[0]}  |  ${result[1]}  |  ${result[2]}  |  ${result[3].replace(/ /g, '').replace(/,/g, ', ')}`);
                        }
                        else {
                            this._itemScoresChannel.send(`${result[0]}  |  ${result[1]}  |  ${result[2]}`);
                        }
                    }
                });
            }
            if (message.content.startsWith('/import --loot') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                const path = message.content.replace('/import --loot ', '');
                fs.createReadStream(path)
                    .on('data', (data) => {
                    let messages = JSON.parse(data);
                    for (let message of messages) {
                        this._lootLogDataChannel.send(message);
                    }
                })
                    .on('error', () => {
                    message.channel.send('File not found.');
                });
            }
            if (message.content.startsWith('/import --seniority') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                const path = message.content.replace('/import --seniority ', '');
                fs.createReadStream(path)
                    .on('data', (data) => {
                    let messages = JSON.parse(data);
                    for (let message of messages) {
                        this._seniorityLogDataChannel.send(message);
                    }
                })
                    .on('error', () => {
                    message.channel.send('File not found.');
                });
            }
            if (message.content.startsWith('/import --attendance') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                const path = message.content.replace('/import --attendance ', '');
                fs.createReadStream(path)
                    .on('data', (data) => {
                    let messages = JSON.parse(data);
                    for (let message of messages) {
                        this._attendanceLogDataChannel.send(message);
                    }
                })
                    .on('error', () => {
                    message.channel.send('File not found.');
                });
            }
            if (message.content === '/backup' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this.backUpValues();
                message.channel.send('Backed up data.');
            }
            if (message.content === '/totalraids' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this._messages.getMessages(this._attendanceLogDataChannel).then((messages) => {
                    message.channel.send(`**${messages.length}** total raids`);
                });
            }
            if (message.content === '/test' && (this.isAdminChannel(message) || message.channel.type === 'dm')) {
                message.channel.send('Bot running.');
            }
            if (message.content.startsWith('/edit --attendance ') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                let query = message.content.replace('/edit --attendance ', '');
                this.editMessage(message, this._attendanceLogDataChannel, query);
            }
            if (message.content.startsWith('/edit --seniority ') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                let query = message.content.replace('/edit --seniority ', '');
                this.editMessage(message, this._seniorityLogDataChannel, query);
            }
            if (message.content.startsWith('/edit --loot ') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                let query = message.content.replace('/edit --loot ', '');
                this.editMessage(message, this._lootLogDataChannel, query);
            }
        }));
    }
    get presentMembers() {
        return Array.from(this._raidChannel1.members.values()).concat(Array.from(this._raidChannel2.members.values()));
    }
    canUseCommands(message) {
        return message.member.roles.some((role) => role.id === this._appSettings['leadership'] || message.author.id === this._appSettings['admin']);
    }
    isAdminChannel(message) {
        return message.channel.id === this._adminChannel.id;
    }
    isItemScoresChannel(message) {
        return message.channel.id === this._itemScoresChannel.id;
    }
    isFeedChannel(message) {
        return message.channel.id === this._feedChannel.id;
    }
    manageAwardMessage(message, member, item, offspec, existing, flags = new Array()) {
        let extras = '';
        if (existing) {
            extras = ' (existing)';
        }
        else if (offspec) {
            extras = ' (offspec)';
        }
        message.channel.send(`Do you wish to award ${member.displayName} **${item.displayName}**${extras}? Please confirm.`).then((sentMessage) => {
            const filter = this.setReactionFilter(sentMessage, message);
            sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                .then((collected) => {
                if (collected.first().emoji.name === '✅') {
                    this._lootLogService.awardItem(message, this._lootLogDataChannel, this._lootLogChannel, item, member, offspec, existing, flags);
                }
                else {
                    message.channel.send('Request to award item aborted.');
                }
            })
                .catch((err) => {
                console.log(err);
                message.channel.send('No reply received. Request to award item aborted.');
            });
        });
    }
    sendHasEmbed(item, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message) {
        return __awaiter(this, void 0, void 0, function* () {
            let membersWhoHave = yield this._lootLogService.getHasLooted(item, this._lootLogDataChannel, this._guildMembers);
            if (membersWhoHave.length > 0) {
                let sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate);
                let filteredMap = this._mapSort.filterMembers(sortedMap, membersWhoHave);
                if (membersOfClass.length > 0) {
                    filteredMap = this._mapSort.filterMembers(filteredMap, membersOfClass);
                }
                let title = `Members who have **${item.displayName}** ${orderString} ${classString}`;
                let mapChunked = this.chunk(Array.from(filteredMap), 15);
                for (let i = 0; i < mapChunked.length; i++) {
                    let first = i === 0;
                    let last = i === mapChunked.length - 1;
                    message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(mapChunked[i], title, first, last));
                }
            }
            else {
                message.channel.send(`No members have **${item.displayName}**.`);
            }
        });
    }
    sendEligibleEmbed(item, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message) {
        return __awaiter(this, void 0, void 0, function* () {
            let membersWhoNeed = yield this._lootLogService.getEligibleMembers(item, this._lootLogDataChannel, this._guildMembers);
            if (membersWhoNeed.length > 0) {
                let sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate);
                let filteredMap = this._mapSort.filterMembers(sortedMap, membersWhoNeed);
                if (membersOfClass.length > 0) {
                    filteredMap = this._mapSort.filterMembers(filteredMap, membersOfClass);
                }
                let title = `Members who need **${item.displayName}** ${orderString} ${classString}`;
                let mapChunked = this.chunk(Array.from(filteredMap), 15);
                for (let i = 0; i < mapChunked.length; i++) {
                    let first = i === 0;
                    let last = i === mapChunked.length - 1;
                    message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(mapChunked[i], title, first, last));
                }
            }
            else {
                message.channel.send(`No members need **${item.displayName}**.`);
            }
        });
    }
    sendLootScoreDailyDump() {
        this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
        this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
            const attendanceMapId = value;
            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
            this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                const seniorityMapId = value;
                this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                    this._lootLogMap = value;
                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._seniorityMap, this._lootLogMap);
                    const sortedMap = this._mapSort.sortByName(this._lootScoreMap);
                    this._lootScoreDailyDumpChannel.fetchMessages({ limit: 100 })
                        .then(messages => this._lootScoreDailyDumpChannel.bulkDelete(messages));
                    this._lootScoreDailyDumpChannel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'Seniority'));
                    for (let entry of sortedMap) {
                        if (entry[0].roles.array().find((x) => x.id === this._appSettings['leadership'] || x.id === this._appSettings['raider'] || x.id === this._appSettings['applicant'])) {
                            this._lootScoreDailyDumpChannel.send(new seniority_embed_1.SeniorityEmbed(sortedMap, entry, this._appSettings));
                        }
                    }
                });
            });
        });
    }
    editMessage(message, channel, query) {
        this._messages.getMessages(channel).then((messages) => {
            let matchingMessages = new Array();
            for (let message of messages) {
                if (message.content.includes(query)) {
                    matchingMessages.push(message);
                }
            }
            if (matchingMessages.length === 1) {
                message.channel.send(`Message matching ${query} found. Please enter the message you would like to replace it with now.`).then((sentMessage) => {
                    const filter = response => {
                        return message.author.id === response.author.id;
                    };
                    sentMessage.channel.awaitMessages(filter, { maxMatches: 1, time: 1800000, errors: ['time'] }).then((collected) => {
                        matchingMessages[0].edit(Array.from(collected.entries())[0][1].cleanContent).then(() => {
                            message.channel.send('Message update successful.');
                        }).catch((err) => {
                            console.log(err);
                            message.channel.send('Message update failed. Try again.');
                        });
                    }).catch((err) => {
                        console.log(err);
                        message.channel.send('Too slow. Try again.');
                    });
                });
            }
            else {
                matchingMessages.length === 0 ? message.channel.send('No matching message found. If you aren\'t already, try including the full timestamp.') : message.channel.send('Too many matching messages found. Try entering the full message body.');
            }
        });
    }
    backUpValues() {
        return __awaiter(this, void 0, void 0, function* () {
            let lootLog = yield this._messages.getMessages(this._lootLogDataChannel);
            let cleanLootLogMessages = new Array();
            for (let message of lootLog) {
                cleanLootLogMessages.push(message.content);
            }
            let seniorityLog = yield this._messages.getMessages(this._seniorityLogDataChannel);
            let cleanSeniorityLogMessages = new Array();
            for (let message of seniorityLog) {
                cleanSeniorityLogMessages.push(message.content);
            }
            let attendanceLog = yield this._messages.getMessages(this._attendanceLogDataChannel);
            let cleanAttendanceLogMessages = new Array();
            for (let message of attendanceLog) {
                cleanAttendanceLogMessages.push(message.content);
            }
            let dir = 'backups';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.createWriteStream(`${dir}/loot-${this._timestamp.monthDayYearFormatted}.json`)
                .write(JSON.stringify(cleanLootLogMessages));
            fs.createWriteStream(`${dir}/seniority-${this._timestamp.monthDayYearFormatted}.json`)
                .write(JSON.stringify(cleanSeniorityLogMessages));
            fs.createWriteStream(`${dir}/attendance-${this._timestamp.monthDayYearFormatted}.json`)
                .write(JSON.stringify(cleanAttendanceLogMessages));
        });
    }
    setReactionFilter(sentMessage, message) {
        sentMessage.react('✅').then(() => sentMessage.react('❌'));
        return (reaction, user) => {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };
    }
    refreshDataMaps() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._guildMembers) {
                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
            }
            let attendanceMapId = yield this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel);
            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
            let seniorityMapId = yield this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel);
            this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
            this._lootLogMap = yield this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers);
            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._seniorityMap, this._lootLogMap);
        });
    }
    chunk(arr, chunkSize) {
        var R = [];
        for (var i = 0, len = arr.length; i < len; i += chunkSize)
            R.push(arr.slice(i, i + chunkSize));
        return R;
    }
}
exports.RaidBot = RaidBot;
exports.classes = ['paladin', 'ret', 'rogue', 'prot', 'fury', 'mage', 'druid', 'feral', 'balance', 'hunter', 'priest', 'shadow', 'warlock'];
