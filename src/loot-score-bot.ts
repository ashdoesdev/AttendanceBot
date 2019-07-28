import * as csv from 'csv-parser';
import { Client, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import * as fs from 'fs';
import { DetailedVisualizationEmbed } from './Embeds/detailed-visualization.embed';
import { HeadingEmbed } from './Embeds/heading.embed';
import { HelpEmbed } from './Embeds/help.embed';
import { ItemsLootedEmbed } from './Embeds/items-looted.embed';
import { MemberOverviewEmbed } from './Embeds/member-overview.embed';
import { SeniorityEmbed } from './Embeds/seniority.embed';
import { MapSortHelper } from './Helpers/map-sort.helper';
import { MemberMatchHelper } from './Helpers/member-match.helper';
import { ItemScore } from './Models/item-score.model';
import { MemberScore } from './Models/loot-score.model';
import { AttendanceService } from './Services/attendance.service';
import { LootLogService } from './Services/loot-log.service';
import { LootScoreService } from './Services/loot-score.service';
import * as stringSimilarity from 'string-similarity';

export class LootScoreBot {
    private _client = new Client();

    private _raidChannel1: VoiceChannel;
    private _raidChannel2: VoiceChannel;
    private _seniorityLogDataChannel: TextChannel;
    private _attendanceLogDataChannel: TextChannel;
    private _attendanceLogChannel: TextChannel;
    private _itemScoresChannel: TextChannel;
    private _lootLogDataChannel: TextChannel;
    private _lootLogChannel: TextChannel;
    private _lootScoreDailyDumpChannel: TextChannel;
    private _adminChannel: TextChannel;

    private _lootScoreService: LootScoreService = new LootScoreService();
    private _lootLogService: LootLogService = new LootLogService();
    private _attendanceService: AttendanceService = new AttendanceService();
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();
    private _mapSort: MapSortHelper = new MapSortHelper();

    private _seniorityMap: Map<GuildMember, number>;
    private _attendanceMap: Map<GuildMember, number[]>;
    private _attendancePercentageMap: Map<GuildMember, number>;
    private _lootScoreMap: Map<GuildMember, MemberScore>;
    private _lootLogMap: Map<GuildMember, ItemScore[]>;

    private _guildMembers: GuildMember[];

    public start(token: string): void {
        this._client.login(token);
        this._client.once('ready', () => {
            console.log('Ready!');

            this._raidChannel1 = this._client.channels.get('565701455420588032') as VoiceChannel;
            this._raidChannel2 = this._client.channels.get('566702461629497365') as VoiceChannel;
            this._seniorityLogDataChannel = this._client.channels.get('599818971180695573') as TextChannel;
            this._attendanceLogDataChannel = this._client.channels.get('571160933804539924') as TextChannel;
            this._attendanceLogChannel = this._client.channels.get('586983799582228482') as TextChannel;
            this._lootLogDataChannel = this._client.channels.get('571795185399234630') as TextChannel;
            this._lootLogChannel = this._client.channels.get('586983990976577557') as TextChannel;
            this._itemScoresChannel = this._client.channels.get('571794427958525962') as TextChannel;
            this._lootScoreDailyDumpChannel = this._client.channels.get('599082030679982080') as TextChannel;
            this._adminChannel = this._client.channels.get('603778824487960685') as TextChannel;

            var CronJob = require('cron').CronJob;
            var job = new CronJob('1/5 * * * * *', () => this.manageDailyJobs.bind(this), null, true, 'America/Los_Angeles');

            job.start();
        });

        this._client.on('message', message => {
            if (message.content === '/help') {
                message.author.send(new HelpEmbed());
            }

            if (message.content === '!clear') {
                message.channel.fetchMessages({ limit: 100 })
                    .then(messages => message.channel.bulkDelete(messages));
            }

            if (message.content === '/start') {
                if (this.canUseCommands(message)) {
                    if (Array.from(this._raidChannel1.members.values()).length > 0 || Array.from(this._raidChannel2.members.values()).length > 0) {
                        message.channel.send('Do you wish to start logging? Please confirm.').then((sentMessage) => {
                            const filter = this.setReactionFilter(sentMessage as Message, message);

                            (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                .then((collected) => {
                                    if (collected.first().emoji.name === '✅') {
                                        this._attendanceService.startLogging(message, this._raidChannel1, this._raidChannel2);
                                    } else {
                                        message.channel.send('Request to start logging aborted.');
                                    }
                                })
                                .catch(() => {
                                    message.channel.send('No reply received. Request to start logging aborted.');
                                });
                        });
                    } else {
                        message.channel.send('No one is in the raid! Request to start logging aborted.');
                    }

                } else {
                    message.channel.send(`<@${message.member.user.id}>, you don't have sufficient permissions do to that`);
                }
            }

            if (message.content === '/end') {
                if (this.canUseCommands(message)) {
                    if (this._attendanceService.loggingInProgress) {
                        message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                            const filter = this.setReactionFilter(sentMessage as Message, message);

                            (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                .then((collected) => {
                                    if (collected.first().emoji.name === '✅') {
                                        this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel);
                                    } else {
                                        message.channel.send('Request to end logging aborted. Logging will continue.');
                                    }
                                })
                                .catch(() => {
                                    message.channel.send('No reply received. Request to end logging aborted. Logging will continue.');
                                });

                        });
                    } else {
                        message.channel.send(`Did you mean to start attendance first? (Hint: !ls s)`);
                    }
                } else {
                    message.channel.send(`<@${message.member.user.id}> ur not my mom`);
                }
            }

            if (message.content === '/end --nolog') {
                if (this.canUseCommands(message)) {
                    if (this._attendanceService.loggingInProgress) {
                        message.channel.send('Are you sure? This command will end the raid and not save any values.').then((sentMessage) => {
                            const filter = this.setReactionFilter(sentMessage as Message, message);

                            (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                .then((collected) => {
                                    if (collected.first().emoji.name === '✅') {
                                        message.channel.send('Logging successfully ended. No records saved from this session.');
                                        this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel, false);
                                    } else {
                                        message.channel.send('Request to end logging aborted. Logging will continue.');
                                    }
                                })
                                .catch(() => {
                                    message.channel.send('No reply received. Request to end logging aborted. Logging will continue.');
                                });
                        });
                    } else {
                        message.channel.send(`Did you mean to start attendance first? (Hint: !ls -s)`);
                    }
                } else {
                    message.channel.send(`<@${message.member.user.id}> is up to something fishy...`);
                }
            }

            if (message.content === '/ls' || message.content === '/ls --asc') {
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

                            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                            let sortedMap = new Map<GuildMember, MemberScore>();

                            if (message.content.includes('--asc')) {
                                sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap, true);
                            } else {
                                sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                            }

                            message.channel.send(new HeadingEmbed('Member', 'Attendance', 'LootScore'));

                            for (let entry of sortedMap) {
                                message.channel.send(new DetailedVisualizationEmbed(sortedMap, entry));
                            }
                        });
                    });
                });
            }

            if (message.content.startsWith('/ls --attendance')) {
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

                            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                            let sortedMap = new Map<GuildMember, MemberScore>();

                            if (message.content.includes('--asc')) {
                                sortedMap = this._mapSort.sortByAttendance(this._lootScoreMap, true);
                            } else {
                                sortedMap = this._mapSort.sortByAttendance(this._lootScoreMap);
                            }

                            message.channel.send(new HeadingEmbed('Member', 'Attendance', 'LootScore'));

                            for (let entry of sortedMap) {
                                message.channel.send(new DetailedVisualizationEmbed(sortedMap, entry));
                            }
                        });
                    });
                });
            }

            if (message.content.startsWith('/ls --name')) {
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

                            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                            let sortedMap = new Map<GuildMember, MemberScore>();

                            if (message.content.includes('--asc')) {
                                sortedMap = this._mapSort.sortByName(this._lootScoreMap, true);
                            } else {
                                sortedMap = this._mapSort.sortByName(this._lootScoreMap);
                            }

                            message.channel.send(new HeadingEmbed('Member', 'Attendance', 'LootScore'));

                            for (let entry of sortedMap) {
                                message.channel.send(new DetailedVisualizationEmbed(sortedMap, entry));
                            }
                        });
                    }); 
                });
            }

            if (message.content.startsWith('/ls --seniority')) {
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

                            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                            let sortedMap = new Map<GuildMember, MemberScore>();

                            if (message.content.includes('--asc')) {
                                sortedMap = this._mapSort.sortBySeniority(this._lootScoreMap, true);
                            } else {
                                sortedMap = this._mapSort.sortBySeniority(this._lootScoreMap);
                            }

                            message.channel.send(new HeadingEmbed('Member', 'Attendance', 'Seniority'));

                            for (let entry of sortedMap) {
                                message.channel.send(new SeniorityEmbed(sortedMap, entry));
                            }
                        });
                    });
                });
            }

            if (message.content.startsWith('/give')) {
                if (this.canUseCommands(message)) {
                    let query = '';
                    query = message.content.replace('/give ', '').replace(/(@\S+)/, '').replace('<', '').trim();

                    let member = message.mentions.members.array()[0];

                    if (member) {
                        this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                            let item = array.find((x) => x.shorthand === query);

                            if (item) {
                                message.channel.send(`Do you wish to award ${member.displayName} **${item.displayName}**? Please confirm.`).then((sentMessage) => {
                                    const filter = this.setReactionFilter(sentMessage as Message, message);

                                    (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                        .then((collected) => {
                                            if (collected.first().emoji.name === '✅') {
                                                this._lootLogService.awardItem(message, this._lootLogDataChannel, this._lootLogChannel, item);
                                            } else {
                                                message.channel.send('Request to award item aborted.');
                                            }
                                        })
                                        .catch(() => {
                                            message.channel.send('No reply received. Request to award item aborted.');
                                        });
                                });

                            } else {
                                message.channel.send('Item does not exist.');

                                let relatedItems = new Array<ItemScore>();

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
                                            } else {
                                                relatedString += `or **${relatedItems[i].shorthand}** (${relatedItems[i].displayName})`;
                                            }
                                        } else {
                                            relatedString += `**${relatedItems[i].shorthand}** (${relatedItems[i].displayName}), `;
                                        }
                                    }

                                    message.channel.send(`Did you mean ${relatedString}?`);
                                }

                            }
                        });
                    } else {
                        message.channel.send('Could not find member. Be sure to @mention a full member name.');
                    }

                } else {
                    message.channel.send(`<@${message.member.user.id}>, you don't have sufficient permissions do to that`);
                }
            }

            if (message.content.startsWith('/needs --all')) {
                let query = message.content.replace('/needs --all ', '').replace(/(@\S+)/, '').replace('<', '').trim();

                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand === query);

                    this._lootLogService.getEligibleMembers(item, this._lootLogDataChannel, this._guildMembers).then((members) => {

                        if (members.length > 0) {
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

                                        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                                        const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                        const filteredMap = this._mapSort.filterMembers(sortedMap, members);

                                        message.channel.send(new HeadingEmbed('Member', 'Attendance', 'LootScore'));

                                        for (let entry of filteredMap) {
                                            message.channel.send(new DetailedVisualizationEmbed(filteredMap, entry));
                                        }
                                    });
                                });
                            });
                        } else {
                            message.channel.send('No members need this item.');
                        }
                    });
                });

            }

            if (message.content.startsWith('/has --all')) {
                let query = message.content.replace('/has --all ', '').replace(/(@\S+)/, '').replace('<', '').trim();

                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand === query);

                    this._lootLogService.getHasLooted(item, this._lootLogDataChannel, this._guildMembers).then((members) => {

                        if (members.length > 0) {
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

                                        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                                        const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                        const filteredMap = this._mapSort.filterMembers(sortedMap, members);

                                        message.channel.send(new HeadingEmbed('Member', 'Attendance', 'LootScore'));

                                        for (let entry of filteredMap) {
                                            message.channel.send(new DetailedVisualizationEmbed(filteredMap, entry));
                                        }
                                    });   
                                });
                            });
                        } else {
                            message.channel.send('No members have this item.');
                        }
                    });
                });
            }

            if (message.content.startsWith('/needs')) {
                let query = message.content.replace('/needs ', '').replace(/(@\S+)/, '').replace('<', '').trim();

                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand === query);

                    this._lootLogService.getEligibleMembers(item, this._lootLogDataChannel, this.presentMembers).then((members) => {

                        if (members.length > 0) {
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

                                        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                                        const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                        const filteredMap = this._mapSort.filterMembers(sortedMap, members);

                                        message.channel.send(new HeadingEmbed('Member', 'Attendance', 'LootScore'));

                                        for (let entry of filteredMap) {
                                            message.channel.send(new DetailedVisualizationEmbed(filteredMap, entry));
                                        }
                                    });
                                });
                            });
                        } else {
                            message.channel.send('No members need this item.');
                        }
                    });
                });

            }

            if (message.content.startsWith('/has')) {
                let query = message.content.replace('/has ', '').replace(/(@\S+)/, '').replace('<', '').trim();

                this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                    let item = array.find((x) => x.shorthand === query);

                    this._lootLogService.getHasLooted(item, this._lootLogDataChannel, this.presentMembers).then((members) => {

                        if (members.length > 0) {
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

                                        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                                        const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                        const filteredMap = this._mapSort.filterMembers(sortedMap, members);

                                        message.channel.send(new HeadingEmbed('Member', 'Attendance', 'LootScore'));

                                        for (let entry of filteredMap) {
                                            message.channel.send(new DetailedVisualizationEmbed(filteredMap, entry));
                                        }
                                    });
                                });
                            });
                        } else {
                            message.channel.send('No members have this item.');
                        }
                    });
                });
            }

            if (message.content.startsWith('/overview')) {
                let member = message.mentions.members.array()[0];

                if (member) {
                    this._guildMembers = this._client.guilds.get('565381445736988682').members.array();

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

                                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                                    const sortedMap = this._mapSort.sortByLootScore(this._lootScoreMap);
                                    const filteredMap = this._mapSort.filterMembers(sortedMap, [member.id]);

                                    if (Array.from(filteredMap).length > 0) {
                                        message.channel.send(`Overview for **${member.displayName}**`);

                                        message.channel.send(new HeadingEmbed('LootScore', 'Attendance', 'Seniority'));

                                        for (let entry of filteredMap) {
                                            message.channel.send(new MemberOverviewEmbed(filteredMap, entry));
                                        }

                                        message.channel.send(new ItemsLootedEmbed(items));
                                    } else {
                                        message.channel.send(`No history found for **${member.displayName}**`);
                                    }

                                });
                            });
                        });
                    });
                } else {
                    message.channel.send('Could not find member. Be sure to @mention a full member name.');
                }
                
            }

            if (message.content.startsWith('/getitemscores')) {
                const path = message.content.replace('ls getitemscores ', '')
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
                            } else {
                                this._itemScoresChannel.send(`${result[0]}  |  ${result[1]}  |  ${result[2]}`);
                            }
                        }
                    });
            }

            if (message.content.startsWith('/import --loot')) {
                const path = message.content.replace('ls import --loot ', '')

                fs.createReadStream(path)
                    .on('data', (data) => {
                        let messages: string[] = JSON.parse(data);

                        for (let message of messages) {
                            this._lootLogDataChannel.send(message);
                        }
                    })
                    .on('error', () => {
                        message.channel.send('File not found.');
                    });
            }

            if (message.content.startsWith('/import --seniority')) {
                const path = message.content.replace('ls import --seniority ', '')

                fs.createReadStream(path)
                    .on('data', (data) => {
                        let messages: string[] = JSON.parse(data);

                        for (let message of messages) {
                            this._seniorityLogDataChannel.send(message);
                        }
                    })
                    .on('error', () => {
                        message.channel.send('File not found.');
                    });
            }

            if (message.content.startsWith('/import --attendance')) {
                const path = message.content.replace('ls import --attendance ', '')

                fs.createReadStream(path)
                    .on('data', (data) => {
                        let messages: string[] = JSON.parse(data);

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

    private get presentMembers(): GuildMember[] {
        return Array.from(this._raidChannel1.members.values()).concat(Array.from(this._raidChannel2.members.values()));
    }

    private canUseCommands(message: Message): boolean {
        return message.member.roles.some((role) => role.name === 'LootScore Admin');
    }

    public manageDailyJobs(): void {
        this.sendLootScoreDailyDump();
        this.backUpValues();
    }

    public sendLootScoreDailyDump(): void {
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

                    this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                    const sortedMap = this._mapSort.sortByName(this._lootScoreMap);

                    this._lootScoreDailyDumpChannel.fetchMessages({ limit: 100 })
                        .then(messages => this._lootScoreDailyDumpChannel.bulkDelete(messages));

                    this._lootScoreDailyDumpChannel.send(new HeadingEmbed('Member', 'Attendance', 'Seniority'));

                    for (let entry of sortedMap) {
                        this._lootScoreDailyDumpChannel.send(new SeniorityEmbed(sortedMap, entry));
                    }
                });
            });
        });

    }

    public async backUpValues(): Promise<void> {
        let lootLog: Message[] = await this._lootLogService.getMessages(this._lootLogDataChannel);
        let cleanLootLogMessages = new Array<string>();

        for (let message of lootLog) {
            cleanLootLogMessages.push(message.content);
        }

        let seniorityLog: Message[] = await this._lootLogService.getMessages(this._seniorityLogDataChannel);
        let cleanSeniorityLogMessages = new Array<string>();

        for (let message of seniorityLog) {
            cleanSeniorityLogMessages.push(message.content);
        }

        let attendanceLog: Message[] = await this._lootLogService.getMessages(this._attendanceLogDataChannel);
        let cleanAttendanceLogMessages = new Array<string>();

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
    }

    public setReactionFilter(sentMessage: Message, message: Message) {
        (sentMessage as Message).react('✅').then(() => (sentMessage as Message).react('❌'));

        return (reaction, user) => {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };
    }

}