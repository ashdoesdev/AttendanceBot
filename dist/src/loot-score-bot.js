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
const member_overview_embed_1 = require("./Embeds/member-overview.embed");
const minimal_visualization_embed_1 = require("./Embeds/minimal-visualization.embed");
const seniority_embed_1 = require("./Embeds/seniority.embed");
const map_sort_helper_1 = require("./Helpers/map-sort.helper");
const member_match_helper_1 = require("./Helpers/member-match.helper");
const messages_helper_1 = require("./Helpers/messages.helper");
const attendance_service_1 = require("./Services/attendance.service");
const loot_log_service_1 = require("./Services/loot-log.service");
const loot_score_service_1 = require("./Services/loot-score.service");
class LootScoreBot {
    constructor() {
        this._client = new discord_js_1.Client();
        this._lootScoreService = new loot_score_service_1.LootScoreService();
        this._lootLogService = new loot_log_service_1.LootLogService();
        this._attendanceService = new attendance_service_1.AttendanceService();
        this._memberMatcher = new member_match_helper_1.MemberMatchHelper();
        this._mapSort = new map_sort_helper_1.MapSortHelper();
        this._messages = new messages_helper_1.MessagesHelper();
    }
    start(token) {
        this._client.login(token);
        this._client.once('ready', () => {
            console.log('Ready!');
            this._raidChannel1 = this._client.channels.get('565701455420588032');
            this._raidChannel2 = this._client.channels.get('566702461629497365');
            this._seniorityLogDataChannel = this._client.channels.get('599818971180695573');
            this._attendanceLogDataChannel = this._client.channels.get('571160933804539924');
            this._attendanceLogChannel = this._client.channels.get('586983799582228482');
            this._lootLogDataChannel = this._client.channels.get('571795185399234630');
            this._lootLogChannel = this._client.channels.get('586983990976577557');
            this._itemScoresChannel = this._client.channels.get('571794427958525962');
            this._lootScoreDailyDumpChannel = this._client.channels.get('599082030679982080');
            this._adminChannel = this._client.channels.get('603778824487960685');
            var CronJob = require('cron').CronJob;
            var job = new CronJob('0 */10 * * * *', () => {
                this.sendLootScoreDailyDump();
                this.backUpValues();
            }, null, true, 'America/Los_Angeles');
            job.start();
        });
        this._client.on('message', message => {
            if (message.content === '/help' && this.canUseCommands(message)) {
                message.author.send(new help_embed_1.HelpEmbed());
            }
            if (message.content === '!clear') {
                message.channel.fetchMessages({ limit: 100 })
                    .then(messages => message.channel.bulkDelete(messages));
            }
            if (message.content === '/start' && this.canUseCommands(message)) {
                if (Array.from(this._raidChannel1.members.values()).length > 0 || Array.from(this._raidChannel2.members.values()).length > 0) {
                    message.channel.send('Do you wish to start logging? Please confirm.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
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
            if (message.content === '/end' && this.canUseCommands(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
                        sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                            if (collected.first().emoji.name === '✅') {
                                this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel);
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
            if (message.content === '/end --nolog' && this.canUseCommands(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you sure? This command will end the raid and not save any values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
                        sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                            if (collected.first().emoji.name === '✅') {
                                message.channel.send('Logging successfully ended. No records saved from this session.');
                                this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel, false);
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
            if ((message.content === '/ls' || message.content === '/ls --asc') && this.canUseCommands(message)) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                        const seniorityMapId = value;
                        this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                        this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                            this._lootLogMap = value;
                            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
                            let sortedMap = new Map();
                            if (message.content.includes('--asc')) {
                                sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap, true);
                            }
                            else {
                                sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                            }
                            let title = 'Overview ordered by **LootScore**';
                            message.content.includes('--asc') ? title += ' (asc)' : title += ' (desc)';
                            message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(sortedMap, title));
                        });
                    });
                });
            }
            if (message.content.startsWith('/ls attendance') && this.canUseCommands(message)) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                        const seniorityMapId = value;
                        this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                        this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                            this._lootLogMap = value;
                            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
                            let sortedMap = new Map();
                            if (message.content.includes('--asc')) {
                                sortedMap = this._mapSort.sortByAttendance(this._lootScoreMap, true);
                            }
                            else {
                                sortedMap = this._mapSort.sortByAttendance(this._lootScoreMap);
                            }
                            let title = 'Overview ordered by **attendance**';
                            message.content.includes('--asc') ? title += ' (asc)' : title += ' (desc)';
                            message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(sortedMap, title));
                        });
                    });
                });
            }
            if (message.content.startsWith('/ls name') && this.canUseCommands(message)) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                        const seniorityMapId = value;
                        this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                        this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                            this._lootLogMap = value;
                            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
                            let sortedMap = new Map();
                            if (message.content.includes('--asc')) {
                                sortedMap = this._mapSort.sortByName(this._lootScoreMap, true);
                            }
                            else {
                                sortedMap = this._mapSort.sortByName(this._lootScoreMap);
                            }
                            let title = 'Overview ordered by **name**';
                            message.content.includes('--asc') ? title += ' (asc)' : title += ' (desc)';
                            message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(sortedMap, title));
                        });
                    });
                });
            }
            if (message.content.startsWith('/ls seniority') && this.canUseCommands(message)) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                        const seniorityMapId = value;
                        this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                        this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                            this._lootLogMap = value;
                            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
                            let sortedMap = new Map();
                            if (message.content.includes('--asc')) {
                                sortedMap = this._mapSort.sortBySeniority(this._lootScoreMap, true);
                            }
                            else {
                                sortedMap = this._mapSort.sortBySeniority(this._lootScoreMap);
                            }
                            let title = 'Overview ordered by **seniority**';
                            message.content.includes('--asc') ? title += ' (asc)' : title += ' (desc)';
                            message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(sortedMap, title));
                        });
                    });
                });
            }
            if (message.content.startsWith('/give') && this.canUseCommands(message)) {
                let query = '';
                query = message.content.replace('/give ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                let memberName = message.content.replace('/give ', '').replace(query, '').trim();
                let member = this._memberMatcher.matchMemberFromName(this._guildMembers, memberName);
                if (member) {
                    this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                        let item = array.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());
                        if (item) {
                            message.channel.send(`Do you wish to award ${member.displayName} **${item.displayName}**? Please confirm.`).then((sentMessage) => {
                                const filter = this.setReactionFilter(sentMessage, message);
                                sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                    .then((collected) => {
                                    if (collected.first().emoji.name === '✅') {
                                        this._lootLogService.awardItem(message, this._lootLogDataChannel, this._lootLogChannel, item);
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
                    message.channel.send('Could not find member. Be sure to type the full display name (not case-sensitive).');
                }
            }
            if (message.content.startsWith('/needs') && this.canUseCommands(message)) {
                let query = message.content.replace('/needs ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());
                    this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                    this._lootLogService.getEligibleMembers(item, this._lootLogDataChannel, this._guildMembers).then((members) => {
                        if (members.length > 0) {
                            this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
                                const attendanceMapId = value;
                                this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                                this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                                this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                                    const seniorityMapId = value;
                                    this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                                    this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                                        this._lootLogMap = value;
                                        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
                                        const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                        const filteredMap = this._mapSort.filterMembers(sortedMap, members);
                                        let title = `Members who are eligible for **${item.displayName}**`;
                                        message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(filteredMap, title));
                                    });
                                });
                            });
                        }
                        else {
                            message.channel.send('No members need this item.');
                        }
                    });
                });
            }
            if (message.content.startsWith('/has') && this.canUseCommands(message)) {
                let query = message.content.replace('/has ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());
                    this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                    this._lootLogService.getHasLooted(item, this._lootLogDataChannel, this._guildMembers).then((members) => {
                        if (members.length > 0) {
                            this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
                                const attendanceMapId = value;
                                this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                                this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                                this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                                    const seniorityMapId = value;
                                    this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                                    this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                                        this._lootLogMap = value;
                                        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
                                        const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                        const filteredMap = this._mapSort.filterMembers(sortedMap, members);
                                        let title = `Members who have **${item.displayName}**`;
                                        message.channel.send(new minimal_visualization_embed_1.MinimalVisualizationEmbed(filteredMap, title));
                                    });
                                });
                            });
                        }
                        else {
                            message.channel.send('No members have this item.');
                        }
                    });
                });
            }
            if (message.content.startsWith('/overview') && this.canUseCommands(message)) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
                let memberName = message.content.replace('/overview ', '');
                let member = this._memberMatcher.matchMemberFromName(this._guildMembers, memberName);
                if (member) {
                    this._lootLogService.getLootHistory(member, this._lootLogDataChannel, this._guildMembers).then((items) => {
                        this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
                            const attendanceMapId = value;
                            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                            this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                            this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                                const seniorityMapId = value;
                                this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                                this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                                    this._lootLogMap = value;
                                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
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
                        });
                    });
                }
                else {
                    message.channel.send('Could not find member. Be sure to type the full display name (not case-sensitive).');
                }
            }
            if (message.content.startsWith('/getitemscores') && this.canUseCommands(message)) {
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
                            this._itemScoresChannel.send(`${result[0]}  |  ${result[1]}  |  ${result[2]}  |  ${result[3]}`);
                        }
                        else {
                            this._itemScoresChannel.send(`${result[0]}  |  ${result[1]}  |  ${result[2]}`);
                        }
                    }
                });
            }
            if (message.content.startsWith('/import --loot') && this.canUseCommands(message)) {
                const path = message.content.replace('ls import --loot ', '');
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
            if (message.content.startsWith('/import --seniority') && this.canUseCommands(message)) {
                const path = message.content.replace('ls import --seniority ', '');
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
            if (message.content.startsWith('/import --attendance') && this.canUseCommands(message)) {
                const path = message.content.replace('ls import --attendance ', '');
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
        });
    }
    get presentMembers() {
        return Array.from(this._raidChannel1.members.values()).concat(Array.from(this._raidChannel2.members.values()));
    }
    canUseCommands(message) {
        return message.channel.id === this._adminChannel.id && message.member.roles.some((role) => role.name === 'LootScore Admin' || role.name === 'Leadership');
    }
    manageDailyJobs() {
        this.sendLootScoreDailyDump();
        this.backUpValues();
    }
    sendLootScoreDailyDump() {
        this._guildMembers = this._client.guilds.get('565381445736988682').members.array();
        this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel).then((value) => {
            const attendanceMapId = value;
            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
            this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
            this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel).then(value => {
                const seniorityMapId = value;
                this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
                this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers).then((value) => {
                    this._lootLogMap = value;
                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
                    const sortedMap = this._mapSort.sortByName(this._lootScoreMap);
                    this._lootScoreDailyDumpChannel.fetchMessages({ limit: 100 })
                        .then(messages => this._lootScoreDailyDumpChannel.bulkDelete(messages));
                    this._lootScoreDailyDumpChannel.send(new heading_embed_1.HeadingEmbed('Member', 'Attendance', 'Seniority'));
                    for (let entry of sortedMap) {
                        this._lootScoreDailyDumpChannel.send(new seniority_embed_1.SeniorityEmbed(sortedMap, entry));
                    }
                });
            });
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
            let dir = 'C:/LootScore/backups';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.createWriteStream(`${dir}/loot.json`)
                .write(JSON.stringify(cleanLootLogMessages));
            fs.createWriteStream(`${dir}/seniority.json`)
                .write(JSON.stringify(cleanSeniorityLogMessages));
            fs.createWriteStream(`${dir}/attendance.json`)
                .write(JSON.stringify(cleanAttendanceLogMessages));
        });
    }
    setReactionFilter(sentMessage, message) {
        sentMessage.react('✅').then(() => sentMessage.react('❌'));
        return (reaction, user) => {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };
    }
}
exports.LootScoreBot = LootScoreBot;
