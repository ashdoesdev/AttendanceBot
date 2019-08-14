import * as csv from 'csv-parser';
import { Client, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import * as fs from 'fs';
import * as stringSimilarity from 'string-similarity';
import { HeadingEmbed } from './Embeds/heading.embed';
import { HelpEmbed } from './Embeds/help.embed';
import { ItemsLootedEmbed } from './Embeds/items-looted.embed';
import { MemberOverviewEmbed } from './Embeds/member-overview.embed';
import { MinimalVisualizationEmbed } from './Embeds/minimal-visualization.embed';
import { SeniorityEmbed } from './Embeds/seniority.embed';
import { MapSortHelper } from './Helpers/map-sort.helper';
import { MemberMatchHelper } from './Helpers/member-match.helper';
import { MessagesHelper } from './Helpers/messages.helper';
import { ItemScore } from './Models/item-score.model';
import { MemberScore } from './Models/loot-score.model';
import { AttendanceService } from './Services/attendance.service';
import { LootLogService } from './Services/loot-log.service';
import { LootScoreService } from './Services/loot-score.service';
import { TimestampHelper } from './Helpers/timestamp.helper';

export class RaidBot {
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
    private _feedChannel: TextChannel;

    private _lootScoreService: LootScoreService = new LootScoreService();
    private _lootLogService: LootLogService = new LootLogService();
    private _attendanceService: AttendanceService = new AttendanceService();
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();
    private _mapSort: MapSortHelper = new MapSortHelper();
    private _messages: MessagesHelper = new MessagesHelper();
    private _timestamp: TimestampHelper = new TimestampHelper();

    private _seniorityMap: Map<GuildMember, number>;
    private _attendanceMap: Map<GuildMember, number[]>;
    private _attendancePercentageMap: Map<GuildMember, number>;
    private _lootScoreMap: Map<GuildMember, MemberScore>;
    private _lootLogMap: Map<GuildMember, ItemScore[]>;

    private _guildMembers: GuildMember[];
    private _appSettings;

    public start(appSettings): void {
        this._appSettings = appSettings;

        this._client.login(appSettings["token"]);
        this._client.once('ready', () => {
            console.log('Ready!');

            this._raidChannel1 = this._client.channels.get(appSettings['raidChannel1']) as VoiceChannel;
            this._raidChannel2 = this._client.channels.get(appSettings['raidChannel2']) as VoiceChannel;
            this._seniorityLogDataChannel = this._client.channels.get(appSettings['seniorityLogDataChannel']) as TextChannel;
            this._attendanceLogDataChannel = this._client.channels.get(appSettings['attendanceLogDataChannel']) as TextChannel;
            this._attendanceLogChannel = this._client.channels.get(appSettings['attendanceLogChannel']) as TextChannel;
            this._lootLogDataChannel = this._client.channels.get(appSettings['lootLogDataChannel']) as TextChannel;
            this._lootLogChannel = this._client.channels.get(appSettings['lootLogChannel']) as TextChannel;
            this._itemScoresChannel = this._client.channels.get(appSettings['itemScoresChannel']) as TextChannel;
            this._lootScoreDailyDumpChannel = this._client.channels.get(appSettings['lootScoreDailyDumpChannel']) as TextChannel;
            this._adminChannel = this._client.channels.get(appSettings['adminChannel']) as TextChannel;
            this._feedChannel = this._client.channels.get(appSettings['feedChannel']) as TextChannel;

            var CronJob = require('cron').CronJob;
            var job = new CronJob('00 00 00 * * *', () => {
                this.backUpValues();
            }, null, true, 'America/Los_Angeles');

            job.start();
        });

        this._client.on('message', async message => {
            if (message.content === '/help' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                message.author.send(new HelpEmbed(this._appSettings));
            }

            if (message.content === '/refresh' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this.sendLootScoreDailyDump();
            }

            if (message.content === '/start' && this.canUseCommands(message) && this.isFeedChannel(message)) {
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
            }

            if (message.content === '/end' && this.canUseCommands(message) && this.isFeedChannel(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage as Message, message);

                        (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel, true, this.sendLootScoreDailyDump.bind(this));
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
            }

            if (message.content === '/end --noseniority' && this.canUseCommands(message) && this.isFeedChannel(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you ready to end logging? This command will end logging and submit all values except seniority.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage as Message, message);

                        (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    this._attendanceService.endLogging(message, null, this._attendanceLogDataChannel, this._attendanceLogChannel, true, this.sendLootScoreDailyDump.bind(this));
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
            }

            if (message.content === '/end --nolog' && this.canUseCommands(message) && this.isFeedChannel(message)) {
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
            }

            if ((message.content.startsWith('/report') && this.canUseCommands(message) && this.isAdminChannel(message))) {
                await this.refreshDataMaps();

                let sortedMap = new Map<GuildMember, MemberScore>();
                let asc = message.content.includes('--asc');
                let orderByName = message.content.includes('--name');
                let orderByAttendance = message.content.includes('--attendance');
                let orderBySeniority = message.content.includes('--seniority');

                let orderString = orderByName ? 'ordered by **name**' : orderByAttendance ? 'ordered by **attendance**' : orderBySeniority ? 'ordered by **seniority**' : 'ordered by **LootScore**';

                asc ? orderString = orderString += ' (asc)' : orderString = orderString += ' (desc)';

                if (message.content.startsWith('/report has')) {
                    let query = message.content.replace('/report has ', '');
                    let itemScores = await this._lootLogService.getItemScores(this._itemScoresChannel);
                    let item = itemScores.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());
                    this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                    let membersWhoHave = await this._lootLogService.getHasLooted(item, this._lootLogDataChannel, this._guildMembers);

                    if (membersWhoHave.length > 0) {
                        const sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, asc, orderByName, orderByAttendance, orderBySeniority);
                        const filteredMap = this._mapSort.filterMembers(sortedMap, membersWhoHave);

                        let title = `Members who have **${item.displayName}**`;

                        message.channel.send(new MinimalVisualizationEmbed(filteredMap, title));
                    } else {
                        message.channel.send('No members have this item.');
                    }
                }
                
                if (message.content.startsWith('/report eligible')) {
                    let query = message.content.replace('/report elibible ', '');
                    let itemScores = await this._lootLogService.getItemScores(this._itemScoresChannel);
                    let item = itemScores.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());
                    this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                    let membersWhoNeed = await this._lootLogService.getEligibleMembers(item, this._lootLogDataChannel, this._guildMembers)

                    if (membersWhoNeed.length > 0) {
                        const sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, asc, orderByName, orderByAttendance, orderBySeniority);
                        const filteredMap = this._mapSort.filterMembers(sortedMap, membersWhoNeed);

                        let title = `Members who need **${item.displayName}** ${orderString}`;

                        message.channel.send(new MinimalVisualizationEmbed(filteredMap, title));
                    } else {
                        message.channel.send('No members need this item.');
                    }
                }

                if (message.content.startsWith('/report all')) {
                    let sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, asc, orderByName, orderByAttendance, orderBySeniority);
                    let title = `Overview ${orderString}`;
                    message.channel.send(new MinimalVisualizationEmbed(sortedMap, title));
                }

                if (message.content.startsWith('/report class')) {
                    let className = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');

                    if (className.length > 0) {
                        this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                        let membersOfClass = this._guildMembers.filter((x) => x.roles.array().find((role) => role.name.toLowerCase() === className.toLowerCase()));
                        if (membersOfClass.length > 0) {
                            let classIds = new Array<string>();

                            for (let member of membersOfClass) {
                                classIds.push(member.id);
                            }

                            let sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, asc, orderByName, orderByAttendance, orderBySeniority);
                            const filteredMap = this._mapSort.filterMembers(sortedMap, classIds);

                            let title = `Overview for **${className.charAt(0).toUpperCase() + className.slice(1).toLowerCase()}** ${orderString}`;
                            message.channel.send(new MinimalVisualizationEmbed(filteredMap, title));
                        } else {
                            message.channel.send('No members of class found. Check the spelling of the class. Not case sensitive.');
                        }

                    } else {
                        message.channel.send('Class not found. Ensure the class flag comes immediately after /report class. Ex: /report class "paladin"');
                    }


                }

            }

            if (message.content.startsWith('/give') && this.canUseCommands(message) && this.isFeedChannel(message)) {
                let query = '';
                query = message.content.replace('/give ', '').replace(/(@\S+)/, '').replace('<', '').trim();

                let member = message.mentions.members.array()[0];

                if (member) {
                    this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                        let item = array.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());

                        if (item) {
                            message.channel.send(`Do you wish to award ${member.displayName} **${item.displayName}**? Please confirm.`).then((sentMessage) => {
                                const filter = this.setReactionFilter(sentMessage as Message, message);

                                (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                                    .then((collected) => {
                                        if (collected.first().emoji.name === '✅') {
                                            this._lootLogService.awardItem(message, this._lootLogDataChannel, this._lootLogChannel, item, member);
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
                    message.channel.send('Could not find member. Be sure to use a @mention.');
                }
            }

            if (message.content.startsWith('/report "') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                let memberName = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');

                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
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
                    message.channel.send('Could not find member. Be sure to type the full display name (not case-sensitive).');
                }
            }

            if (message.content.startsWith('/getitemscores') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                const path = message.content.replace('/getitemscores ', '')
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

            if (message.content.startsWith('/import --loot') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                const path = message.content.replace('/import --loot ', '')

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

            if (message.content.startsWith('/import --seniority') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                const path = message.content.replace('/import --seniority ', '')

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

            if (message.content.startsWith('/import --attendance') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                const path = message.content.replace('/import --attendance ', '')

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

            if (message.content === '/backup' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this.backUpValues();
            }
             
            if (message.content === '/totalraids' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this._messages.getMessages(this._attendanceLogDataChannel).then((messages) => {
                    message.channel.send(`**${messages.length}** total raids`);
                });
            }

            if (message.content === '/hi' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                message.channel.send('I\'m here');
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

        });
    }

    private get presentMembers(): GuildMember[] {
        return Array.from(this._raidChannel1.members.values()).concat(Array.from(this._raidChannel2.members.values()));
    }

    private canUseCommands(message: Message): boolean {
        return message.member.roles.some((role) => role.id === this._appSettings['leadership'] || message.author.id === this._appSettings['admin']);
    }

    private isAdminChannel(message: Message): boolean {
        return message.channel.id === this._adminChannel.id;
    }
    
    private isFeedChannel(message: Message): boolean {
        return message.channel.id === this._feedChannel.id;
    }

    public manageDailyJobs(): void {
        this.sendLootScoreDailyDump();
        this.backUpValues();
    }

    public sendLootScoreDailyDump(): void {
        this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();

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

                    this._lootScoreDailyDumpChannel.send(new HeadingEmbed('Member', 'Attendance', 'Seniority'));

                    for (let entry of sortedMap) {
                        this._lootScoreDailyDumpChannel.send(new SeniorityEmbed(sortedMap, entry, this._appSettings));
                    }
                });
            });
        });

    }

    public editMessage(message: Message, channel: TextChannel, query: string) {
        this._messages.getMessages(channel).then((messages) => {
            let matchingMessages = new Array<Message>();

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

                    (sentMessage as Message).channel.awaitMessages(filter, { maxMatches: 1, time: 1800000, errors: ['time'] }).then((collected) => {
                        matchingMessages[0].edit(Array.from(collected.entries())[0][1].cleanContent).then(() => {
                            message.channel.send('Message update successful.');
                        }).catch((err) => {
                            message.channel.send('Message update failed. Try again.');
                        });
                    }).catch(() => {
                        message.channel.send('Too slow. Try again.');
                    });
                });
            } else {
                matchingMessages.length === 0 ? message.channel.send('No matching message found. If you aren\'t already, try including the full timestamp.') : message.channel.send('Too many matching messages found. Try entering the full message body.');
            }
        });
    }

    public async backUpValues(): Promise<void> {
        let lootLog: Message[] = await this._messages.getMessages(this._lootLogDataChannel);
        let cleanLootLogMessages = new Array<string>();

        for (let message of lootLog) {
            cleanLootLogMessages.push(message.content);
        }

        let seniorityLog: Message[] = await this._messages.getMessages(this._seniorityLogDataChannel);
        let cleanSeniorityLogMessages = new Array<string>();

        for (let message of seniorityLog) {
            cleanSeniorityLogMessages.push(message.content);
        }

        let attendanceLog: Message[] = await this._messages.getMessages(this._attendanceLogDataChannel);
        let cleanAttendanceLogMessages = new Array<string>();

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
    }

    public setReactionFilter(sentMessage: Message, message: Message) {
        (sentMessage as Message).react('✅').then(() => (sentMessage as Message).react('❌'));

        return (reaction, user) => {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };
    }

    public async refreshDataMaps(): Promise<void> {
        this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();

        let attendanceMapId = await this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel);
        this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
        this._attendancePercentageMap = this._lootScoreService.getAttendancePercentageMap(this._attendanceMap);

        let seniorityMapId = await this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel);
        this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);

        this._lootLogMap = await this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers);
        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._attendancePercentageMap, this._seniorityMap, this._lootLogMap);
    }
}