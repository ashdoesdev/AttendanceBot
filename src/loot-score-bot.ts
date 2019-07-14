import { Client, VoiceChannel, Message, MessageEmbed, RichEmbed, GuildMember, Collection, TextChannel } from 'discord.js';
import { Observable, timer, Subscription } from 'rxjs';
import { HelpEmbed } from './Embeds/help.embed';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { inspect } from 'util';
import { LootScoreService } from './Services/loot-score.service';
import { AttendanceService } from './Services/attendance.service';
import { MemberMatchHelper } from './Helpers/member-match.helper';
import { DetailedVisualizationEmbed } from './Embeds/detailed-visualization.embed';
import { MemberScore } from './Models/loot-score.model';
import { HeadingEmbed } from './Embeds/heading.embed';
import { SeniorityEmbed } from './Embeds/seniority.embed';
import { MapSortHelper } from './Helpers/map-sort.helper';
import { LootLogService } from './Services/loot-log.service';
import { getEditDistance } from './Helpers/levenshtein';
import { ItemScore } from './Models/item-score.model';
import { MemberOverviewEmbed } from './Embeds/member-overview.embed';
import { ItemsLootedEmbed } from './Embeds/items-looted.embed';
var stringSimilarity = require('string-similarity');

export class LootScoreBot {
    private _client = new Client();

    private _raidChannel1: VoiceChannel;
    private _raidChannel2: VoiceChannel;
    private _attendanceLogChannel: TextChannel;
    private _attendanceLogReadableChannel: TextChannel;
    private _itemScoresChannel: TextChannel;
    private _lootLogChannel: TextChannel;
    private _lootLogReadableChannel: TextChannel;
    private _lootScoreDailyDumpChannel: TextChannel;

    private _lootScoreService: LootScoreService = new LootScoreService();
    private _lootLogService: LootLogService = new LootLogService();
    private _attendanceService: AttendanceService = new AttendanceService();
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();
    private _mapSort: MapSortHelper = new MapSortHelper();

    private _attendanceMap: Map<GuildMember, number[]>;
    private _attendancePercentageMap: Map<GuildMember, number>;
    private _seniorityMap: Map<GuildMember, number>;
    private _lootScoreMap: Map<GuildMember, MemberScore>;
    private _lootLogMap: Map<GuildMember, ItemScore[]>;

    private _guildMembers: GuildMember[];

    public start(token: string): void {
        this._client.login(token);
        this._client.once('ready', () => {
            console.log('Ready!');

            this._raidChannel1 = this._client.channels.get('565701455420588032') as VoiceChannel;
            this._raidChannel2 = this._client.channels.get('566702461629497365') as VoiceChannel;
            this._attendanceLogChannel = this._client.channels.get('571160933804539924') as TextChannel;
            this._attendanceLogReadableChannel = this._client.channels.get('586983799582228482') as TextChannel;
            this._lootLogChannel = this._client.channels.get('571795185399234630') as TextChannel;
            this._lootLogReadableChannel = this._client.channels.get('586983990976577557') as TextChannel;
            this._itemScoresChannel = this._client.channels.get('571794427958525962') as TextChannel;
            this._lootScoreDailyDumpChannel = this._client.channels.get('599082030679982080') as TextChannel;

            var CronJob = require('cron').CronJob;
            var job = new CronJob({
                cronTime: '1/5 * * * *',
                onTick: function () {
                    this.sendLootScoreDailyDump();
                    this.backUpData();
                }.bind(this),
                timeZone: 'America/Los_Angeles'
            });

            job.start();
        });

        this._client.on('message', message => {
            if (message.content === 'ls h' || message.content === 'ls help') {
                message.channel.send(new HelpEmbed());
            }

            if (message.content === '!clear') {
                message.channel.fetchMessages({ limit: 50 })
                    .then(messages => message.channel.bulkDelete(messages));
            }

            if (message.content === 'ls s' || message.content === 'ls start') {
                if (this.canUseCommands(message)) {
                    if (Array.from(this._raidChannel1.members.values()).length > 0 || Array.from(this._raidChannel2.members.values()).length > 0) {
                        message.channel.send('Do you wish to start logging? Please confirm.').then((sentMessage) => {
                            (sentMessage as Message).react('✅').then(() => (sentMessage as Message).react('❌'));

                            const filter = (reaction, user) => {
                                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                            };

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

            if (message.content === 'ls e' || message.content === 'ls end') {
                if (this.canUseCommands(message)) {
                    if (this._attendanceService.loggingInProgress) {
                        message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                            (sentMessage as Message).react('✅').then(() => (sentMessage as Message).react('❌'));

                            const filter = (reaction, user) => {
                                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                            };

                            (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                .then((collected) => {
                                    if (collected.first().emoji.name === '✅') {
                                        this._attendanceService.endLogging(message, this._attendanceLogChannel, this._attendanceLogReadableChannel);
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

            if (message.content === 'ls e --nolog' || message.content === 'ls end --nolog') {
                if (this.canUseCommands(message)) {
                    if (this._attendanceService.loggingInProgress) {
                        message.channel.send('Are you sure? This command will end the raid and not save any values.').then((sentMessage) => {
                            (sentMessage as Message).react('✅').then(() => (sentMessage as Message).react('❌'));

                            const filter = (reaction, user) => {
                                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                            };

                            (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                .then((collected) => {
                                    if (collected.first().emoji.name === '✅') {
                                        message.channel.send('Logging successfully ended. No records saved from this session.');
                                        this._attendanceService.endLogging(message, this._attendanceLogChannel, this._attendanceLogReadableChannel, false);
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

            if (message.content.startsWith('ls --ls')) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();

                this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                    this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
            }

            if (message.content.startsWith('ls --attendance')) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();

                this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                    this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
            }

            if (message.content.startsWith('ls --name')) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();

                this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                    this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
            }

            if (message.content.startsWith('ls --seniority')) {
                this._guildMembers = this._client.guilds.get('565381445736988682').members.array();

                this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                    const attendanceMapId = value;
                    this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                    this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                    this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                    this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
            }

            if (message.content.startsWith('ls g ') || message.content.startsWith('ls give ')) {
                if (this.canUseCommands(message)) {

                    let query = '';

                    if (message.content.includes('give')) {
                        query = message.content.replace('ls give ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                    } else {
                        query = message.content.replace('ls g ', '').replace(/(@\S+)/, '').replace('<', '').trim();
                    }

                    let member = message.mentions.members.array()[0];

                    if (member) {
                        this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                            let item = array.find((x) => x.shorthand === query);

                            if (item) {
                                message.channel.send(`Do you wish to award ${member.displayName} **${item.displayName}**? Please confirm.`).then((sentMessage) => {
                                    (sentMessage as Message).react('✅').then(() => (sentMessage as Message).react('❌'));

                                    const filter = (reaction, user) => {
                                        return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                                    };

                                    (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                        .then((collected) => {
                                            if (collected.first().emoji.name === '✅') {
                                                this._lootLogService.awardItem(message, this._lootLogChannel, this._lootLogReadableChannel, item);
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
                                this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
                        } else {
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
                                this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
                        } else {
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
                                this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
                        } else {
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
                                this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
                        } else {
                            message.channel.send('No members have this item.');
                        }
                    });
                });
            }

            if (message.content.startsWith('ls overview')) {
                let member = message.mentions.members.array()[0];

                if (member) {
                    this._guildMembers = this._client.guilds.get('565381445736988682').members.array();

                    this._lootLogService.getLootHistory(member, this._lootLogChannel, this._guildMembers).then((items) => {

                        this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
                            const attendanceMapId = value;
                            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
                            this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
                            this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
                            this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
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
                } else {
                    message.channel.send('Could not find member. Be sure to @mention a full member name.');
                }
                
            }

            if (message.content.startsWith('ls getitemscores')) {
                const path = message.content.replace('ls getitemscores ', '')
                const results = [];

                fs.createReadStream(path)
                    .pipe(csv({ headers: false }))
                    .on('data', (data) => results.push(data))
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
        });
    }

    private get presentMembers(): GuildMember[] {
        return Array.from(this._raidChannel1.members.values()).concat(Array.from(this._raidChannel2.members.values()));
    }

    private canUseCommands(message: Message): boolean {
        return message.member.roles.some((role) => role.name === 'LootScore Admin');
    }

    public sendLootScoreDailyDump(): void {

        this._guildMembers = this._client.guilds.get('565381445736988682').members.array();

        this._lootScoreService.getAttendanceMap(this._attendanceLogChannel).then((value) => {
            const attendanceMapId = value;
            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
            this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);
            this._seniorityMap = this._lootScoreService.getSeniorityMap(this._attendanceMap);
            this._lootLogService.createLootLogMap(this._lootLogChannel, this._guildMembers).then((value) => {
                this._lootLogMap = value;

                this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);

                const sortedMap = this._mapSort.sortByName(this._lootScoreMap);

                this._lootScoreDailyDumpChannel.fetchMessages({ limit: 100 })
                    .then(messages => this._lootScoreDailyDumpChannel.bulkDelete(messages));

                this._lootScoreDailyDumpChannel.send(new HeadingEmbed('Member', 'Attendance', 'LootScore'));

                for (let entry of sortedMap) {
                    this._lootScoreDailyDumpChannel.send(new DetailedVisualizationEmbed(sortedMap, entry));
                }
            });
        });

    }

    public backUpValues(): void {
        let lootLogMessages = this._lootLogChannel.messages.array();

        fs.createWriteStream('C:/backups/test.json')
            .write(JSON.stringify(lootLogMessages));
    }

}