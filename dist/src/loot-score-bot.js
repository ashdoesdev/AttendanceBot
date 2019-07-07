"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const help_embed_1 = require("./Embeds/help.embed");
const fs = require("fs");
const csv = require("csv-parser");
const loot_score_service_1 = require("./Services/loot-score.service");
const attendance_service_1 = require("./Services/attendance.service");
const member_match_helper_1 = require("./Helpers/member-match.helper");
const detailed_visualization_embed_1 = require("./Embeds/detailed-visualization.embed");
const heading_embed_1 = require("./Embeds/heading.embed");
const seniority_embed_1 = require("./Embeds/seniority.embed");
const map_sort_helper_1 = require("./Helpers/map-sort.helper");
const loot_log_service_1 = require("./Services/loot-log.service");
const member_overview_embed_1 = require("./Embeds/member-overview.embed");
const items_looted_embed_1 = require("./Embeds/items-looted.embed");
var stringSimilarity = require('string-similarity');
class LootScoreBot {
    constructor() {
        this._client = new discord_js_1.Client();
        this._lootScoreService = new loot_score_service_1.LootScoreService();
        this._lootLogService = new loot_log_service_1.LootLogService();
        this._attendanceService = new attendance_service_1.AttendanceService();
        this._memberMatcher = new member_match_helper_1.MemberMatchHelper();
        this._mapSort = new map_sort_helper_1.MapSortHelper();
    }
    start(token) {
        this._client.login(token);
        this._client.once('ready', () => {
            console.log('Ready!');
            this._raidChannel1 = this._client.channels.get('565701455420588032');
            this._raidChannel2 = this._client.channels.get('566702461629497365');
            this._attendanceLogChannel = this._client.channels.get('571160933804539924');
            this._attendanceLogReadableChannel = this._client.channels.get('586983799582228482');
            this._lootLogChannel = this._client.channels.get('571795185399234630');
            this._lootLogReadableChannel = this._client.channels.get('586983990976577557');
            this._itemScoresChannel = this._client.channels.get('571794427958525962');
        });
        this._client.on('message', message => {
            if (message.content === 'ls h' || message.content === 'ls help') {
                message.channel.send(new help_embed_1.HelpEmbed());
            }
            if (message.content === '!clear') {
                message.channel.fetchMessages({ limit: 50 })
                    .then(messages => message.channel.bulkDelete(messages));
            }
            if (message.content === 'ls s' || message.content === 'ls start') {
                if (this.canUseCommands(message)) {
                    if (Array.from(this._raidChannel1.members.values()).length > 0 || Array.from(this._raidChannel2.members.values()).length > 0) {
                        message.channel.send('Do you wish to start logging? Please confirm.').then((sentMessage) => {
                            sentMessage.react('✅').then(() => sentMessage.react('❌'));
                            const filter = (reaction, user) => {
                                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                            };
                            sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    this._attendanceService.startLogging(message, this._raidChannel1, this._raidChannel2);
                                }
                                else {
                                    message.channel.send('Request to start logging aborted.');
                                }
                            })
                                .catch(() => {
                                message.channel.send('No reply received. Request to start logging aborted.');
                            });
                        });
                    }
                    else {
                        message.channel.send('No one is in the raid! Request to start logging aborted.');
                    }
                }
                else {
                    message.channel.send(`<@${message.member.user.id}>, you don't have sufficient permissions do to that`);
                }
            }
            if (message.content === 'ls e' || message.content === 'ls end') {
                if (this.canUseCommands(message)) {
                    if (this._attendanceService.loggingInProgress) {
                        message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                            sentMessage.react('✅').then(() => sentMessage.react('❌'));
                            const filter = (reaction, user) => {
                                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                            };
                            sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    this._attendanceService.endLogging(message, this._attendanceLogChannel, this._attendanceLogReadableChannel);
                                }
                                else {
                                    message.channel.send('Request to end logging aborted. Logging will continue.');
                                }
                            })
                                .catch(() => {
                                message.channel.send('No reply received. Request to end logging aborted. Logging will continue.');
                            });
                        });
                    }
                    else {
                        message.channel.send(`Did you mean to start attendance first? (Hint: !ls s)`);
                    }
                }
                else {
                    message.channel.send(`<@${message.member.user.id}> ur not my mom`);
                }
            }
            if (message.content === 'ls e --nolog' || message.content === 'ls end --nolog') {
                if (this.canUseCommands(message)) {
                    if (this._attendanceService.loggingInProgress) {
                        message.channel.send('Are you sure? This command will end the raid and not save any values.').then((sentMessage) => {
                            sentMessage.react('✅').then(() => sentMessage.react('❌'));
                            const filter = (reaction, user) => {
                                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                            };
                            sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    message.channel.send('Logging successfully ended. No records saved from this session.');
                                    this._attendanceService.endLogging(message, this._attendanceLogChannel, this._attendanceLogReadableChannel, false);
                                }
                                else {
                                    message.channel.send('Request to end logging aborted. Logging will continue.');
                                }
                            })
                                .catch(() => {
                                message.channel.send('No reply received. Request to end logging aborted. Logging will continue.');
                            });
                        });
                    }
                    else {
                        message.channel.send(`Did you mean to start attendance first? (Hint: !ls -s)`);
                    }
                }
                else {
                    message.channel.send(`<@${message.member.user.id}> is up to something fishy...`);
                }
            }
            if (message.content === 'ls --ls') {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                    const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                    message.channel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'LootScore'));
                    for (let entry of sortedMap) {
                        message.channel.send(new detailed_visualization_embed_1.DetailedVisualizationEmbed(sortedMap, entry));
                    }
                });
            }
            if (message.content === 'ls --attendance') {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                    const sortedMap = this._mapSort.sortByAttendance(this._lootScoreMap);
                    message.channel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'LootScore'));
                    for (let entry of sortedMap) {
                        message.channel.send(new detailed_visualization_embed_1.DetailedVisualizationEmbed(sortedMap, entry));
                    }
                });
            }
            if (message.content === 'ls --name') {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                    const sortedMap = this._mapSort.sortByName(this._lootScoreMap);
                    message.channel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'LootScore'));
                    for (let entry of sortedMap) {
                        message.channel.send(new detailed_visualization_embed_1.DetailedVisualizationEmbed(sortedMap, entry));
                    }
                });
            }
            if (message.content === 'ls --seniority') {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                    const sortedMap = this._mapSort.sortBySeniority(this._lootScoreMap);
                    message.channel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'Seniority'));
                    message.channel.send(new seniority_embed_1.SeniorityEmbed(sortedMap));
                });
            }
            if (message.content.startsWith('ls g ') || message.content.startsWith('ls give ')) {
                if (this.canUseCommands(message)) {
                    let query = '';
                    if (message.content.includes('give')) {
                        query = message.content.replace('ls give ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                    }
                    else {
                        query = message.content.replace('ls g ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                    }
                    this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                        let item = array.find((x) => x.shorthand === query);
                        if (item) {
                            message.channel.send(`Do you wish to award ${message.mentions.members.array()[0].displayName} **${item.displayName}**? Please confirm.`).then((sentMessage) => {
                                sentMessage.react('✅').then(() => sentMessage.react('❌'));
                                const filter = (reaction, user) => {
                                    return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                                };
                                sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                    .then((collected) => {
                                    if (collected.first().emoji.name === '✅') {
                                        this._lootLogService.awardItem(message, this._lootLogChannel, this._lootLogReadableChannel, item);
                                    }
                                    else {
                                        message.channel.send('Request to award item aborted.');
                                    }
                                })
                                    .catch(() => {
                                    message.channel.send('No reply received. Request to award item aborted.');
                                });
                            });
                        }
                        else {
                            message.channel.send('Item does not exist.');
                            let relatedItems = new Array();
                            array.forEach((item) => {
                                var shorthandSimilarity = stringSimilarity.compareTwoStrings(query, item.shorthand);
                                var displayNameSimilarity = stringSimilarity.compareTwoStrings(query, item.displayName);
                                if (shorthandSimilarity > .5 || displayNameSimilarity > .25 || item.displayName.includes(query) || item.shorthand.includes(query)) {
                                    relatedItems.push(item);
                                }
                            });
                            let relatedString = '';
                            if (relatedItems.length > 0) {
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
                    });
                }
                else {
                    message.channel.send(`<@${message.member.user.id}>, you don't have sufficient permissions do to that`);
                }
            }
            if (message.content.startsWith('ls needs --all')) {
                let query = message.content.replace('ls needs --all ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand === query);
                    this._lootLogService.getEligibleMembers(item, this._lootLogChannel, this._guildMembers).then((members) => {
                        if (members.length > 0) {
                            this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                            this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                                const attendanceMapId = value;
                                this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                                this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                                this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                                this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                                const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                const filteredMap = this._mapSort.filterMembers(sortedMap, members);
                                message.channel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'LootScore'));
                                for (let entry of filteredMap) {
                                    message.channel.send(new detailed_visualization_embed_1.DetailedVisualizationEmbed(filteredMap, entry));
                                }
                            });
                        }
                        else {
                            message.channel.send('No members need this item.');
                        }
                    });
                });
            }
            if (message.content.startsWith('ls has --all')) {
                let query = message.content.replace('ls has --all ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand === query);
                    this._lootLogService.getHasLooted(item, this._lootLogChannel, this._guildMembers).then((members) => {
                        if (members.length > 0) {
                            this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                            this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                                const attendanceMapId = value;
                                this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                                this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                                this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                                this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                                const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                const filteredMap = this._mapSort.filterMembers(sortedMap, members);
                                message.channel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'LootScore'));
                                for (let entry of filteredMap) {
                                    message.channel.send(new detailed_visualization_embed_1.DetailedVisualizationEmbed(filteredMap, entry));
                                }
                            });
                        }
                        else {
                            message.channel.send('No members have this item.');
                        }
                    });
                });
            }
            if (message.content.startsWith('ls needs')) {
                let query = message.content.replace('ls needs ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand === query);
                    this._lootLogService.getEligibleMembers(item, this._lootLogChannel, this.presentMembers).then((members) => {
                        if (members.length > 0) {
                            this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                            this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                                const attendanceMapId = value;
                                this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                                this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                                this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                                this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                                const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                const filteredMap = this._mapSort.filterMembers(sortedMap, members);
                                message.channel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'LootScore'));
                                for (let entry of filteredMap) {
                                    message.channel.send(new detailed_visualization_embed_1.DetailedVisualizationEmbed(filteredMap, entry));
                                }
                            });
                        }
                        else {
                            message.channel.send('No members need this item.');
                        }
                    });
                });
            }
            if (message.content.startsWith('ls has')) {
                let query = message.content.replace('ls has ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand === query);
                    this._lootLogService.getHasLooted(item, this._lootLogChannel, this.presentMembers).then((members) => {
                        if (members.length > 0) {
                            this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                            this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                                const attendanceMapId = value;
                                this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                                this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                                this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                                this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                                const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                const filteredMap = this._mapSort.filterMembers(sortedMap, members);
                                message.channel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'LootScore'));
                                for (let entry of filteredMap) {
                                    message.channel.send(new detailed_visualization_embed_1.DetailedVisualizationEmbed(filteredMap, entry));
                                }
                            });
                        }
                        else {
                            message.channel.send('No members have this item.');
                        }
                    });
                });
            }
            if (message.content.startsWith('ls overview')) {
                let member = message.mentions.members.array()[0];
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootLogService.getLootHistory(member.id, this._lootLogChannel).then((items) => {
                    this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                        const attendanceMapId = value;
                        this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                        this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                        this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap);
                        const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                        const filteredMap = this._mapSort.filterMembers(sortedMap, [member.id]);
                        if (Array.from(filteredMap).length > 0) {
                            message.channel.send(`Overview for **${member.displayName}**`);
                            message.channel.send(new heading_embed_1.HeadingEmbed('LootScore', 'Attendance', 'Seniority'));
                            for (let entry of filteredMap) {
                                message.channel.send(new member_overview_embed_1.MemberOverviewEmbed(filteredMap, entry));
                            }
                            message.channel.send(new items_looted_embed_1.ItemsLootedEmbed(items));
                        }
                        else {
                            message.channel.send(`No history found for **${member.displayName}**`);
                        }
                    });
                });
            }
            if (message.content.startsWith('ls getitemscores')) {
                const path = message.content.replace('ls getitemscores ', '');
                const results = [];
                fs.createReadStream(path)
                    .pipe(csv({ headers: false }))
                    .on('data', (data) => results.push(data))
                    .on('end', () => {
                    for (let result of results) {
                        if (result[3]) {
                            this._itemScoresChannel.send(`${result[0]}  |  ${result[1]}  |  ${result[2]}  |  ${result[3]}`);
                        }
                        else {
                            this._itemScoresChannel.send(`${result[0]}  |  ${result[1]}  |  ${result[2]}`);
                        }
                    }
                });
            }
        });
    }
    get presentMembers() {
        return Array.from(this._raidChannel1.members.values()).concat(Array.from(this._raidChannel2.members.values()));
    }
    canUseCommands(message) {
        return message.member.roles.some((role) => role.name === 'LootScore Admin');
    }
}
exports.LootScoreBot = LootScoreBot;
