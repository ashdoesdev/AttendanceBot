import * as csv from 'csv-parser';
import { Client, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import * as fs from 'fs';
import * as stringSimilarity from 'string-similarity';
import { HeadingEmbed } from './Embeds/heading.embed';
import { HelpEmbed } from './Embeds/help.embed';
import { ItemsLootedEmbed } from './Embeds/items-looted.embed';
import { MinimalVisualizationEmbed } from './Embeds/minimal-visualization.embed';
import { PublicAttendanceEmbed } from './Embeds/public-attendance.embed';
import { MapSortHelper } from './Helpers/map-sort.helper';
import { MemberMatchHelper } from './Helpers/member-match.helper';
import { MessagesHelper } from './Helpers/messages.helper';
import { ItemScore, AwardedItem } from './Models/item-score.model';
import { MemberScore, LootScoreData, LootScore, MinimalMember } from './Models/loot-score.model';
import { AttendanceService } from './Services/attendance.service';
import { LootLogService } from './Services/loot-log.service';
import { LootScoreService } from './Services/loot-score.service';
import { TimestampHelper } from './Helpers/timestamp.helper';
import { StatsEmbed } from './Embeds/stats.embed';
import { LastRaidLootEmbed } from './Embeds/last-raid-loot.embed';
import { LastRaidAttendanceEmbed } from './Embeds/last-raid-attendance.embed';
import { ItemsLootedExpandedEmbed } from './Embeds/items-looted-expanded.embed';
import { StatsHelper } from './Helpers/stats.helper';

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
    private _statsHelper: StatsHelper = new StatsHelper();

    private _seniorityMap: Map<GuildMember, number>;
    private _attendanceMap: Map<GuildMember, number[]>;
    private _lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>;
    private _lootLogMap: Map<GuildMember | MinimalMember, LootScoreData<AwardedItem>[]>;

    private _guildMembers: GuildMember[];
    private _unfoundMembers: MinimalMember[];
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

            this.refreshDataMaps();
        });

        this._client.on('message', async message => {
            if (message.content === '/help' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                message.author.send(new HelpEmbed(this._appSettings));
            }

            if (message.content === '/refreshpublic' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this.updateAttendanceChart();
            }
            
            if (message.content === '/refreshinternal' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                await this.refreshDataMaps();
                message.channel.send('Refreshed data.');
            }
            
            if (message.content === '/refreshmembers' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                this._unfoundMembers = this.getUnfoundMembers(this._lootLogMap);
                message.channel.send('Refreshed guild members.');
            }

            if ((message.content === '/s' || message.content === '/start') && this.canUseCommands(message) && this.isFeedChannel(message)) {
                if (Array.from(this._raidChannel1.members.values()).length > 0 || Array.from(this._raidChannel2.members.values()).length > 0) {
                    message.channel.send('Do you wish to start logging? Please confirm.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage as Message, message);

                        (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    this._attendanceService.startLogging(message, this._raidChannel1, this._raidChannel2, this._appSettings);
                                } else {
                                    message.channel.send('Request to start logging aborted.');
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                message.channel.send('No reply received. Request to start logging aborted.');
                            });
                    });
                } else {
                    message.channel.send('No one is in the raid! Request to start logging aborted.');
                }
            }

            if ((message.content === '/end' || message.content === '/e') && this.canUseCommands(message) && this.isFeedChannel(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage as Message, message);

                        (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    message.channel.send('*Saving attendance . . .*');
                                    this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                                    this._unfoundMembers = this.getUnfoundMembers(this._lootLogMap);

                                    this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel, this._guildMembers, this._appSettings, true, this.updateAttendanceChart.bind(this));
                                } else {
                                    message.channel.send('Request to end logging aborted. Logging will continue.');
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                message.channel.send('No reply received. Request to end logging aborted. Logging will continue.');
                            });

                    });
                } else {
                    message.channel.send(`Did you mean to start attendance first? (Hint: !ls s)`);
                }
            }

            if ((message.content === '/end --nolog' || message.content === '/e --nolog') && this.canUseCommands(message) && this.isFeedChannel(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you sure? This command will end the raid and not save any values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage as Message, message);

                        (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    message.channel.send('Logging successfully ended. No records saved from this session.');

                                    this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel, this._guildMembers, this._appSettings, false);
                                } else {
                                    message.channel.send('Request to end logging aborted. Logging will continue.');
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                message.channel.send('No reply received. Request to end logging aborted. Logging will continue.');
                            });
                    });
                } else {
                    message.channel.send(`Did you mean to start attendance first? (Hint: !ls -s)`);
                }
            }

            if ((message.content.startsWith('/report') && this.canUseCommands(message) && this.isAdminChannel(message))) {
                await this.ensureHasDataMaps();

                let modifiers = message.content.split(' ').filter((x) => x.startsWith('--'));

                modifiers.forEach((modifier, i) => {
                    modifiers[i] = modifier.slice(2).toLowerCase();
                });

                let classModifiers = modifiers.filter((modifier) => classes.includes(modifier));

                let orderByName = message.content.includes('--name');
                let orderByAttendance = message.content.includes('--attendance');
                let orderBySeniority = message.content.includes('--seniority');
                let orderByOffspecItemScore = message.content.includes('--offspec');
                let orderByLastLootDate = message.content.includes('--lastloot');
                let showInactiveOnly = message.content.includes('--inactive');
                let showAll = message.content.includes('--all');

                let orderString = 'ordered by ';
                let classString = '';

                let membersOfClass = new Array<string>();

                if (classModifiers.length > 0) {
                    classString += '(showing ';

                    if (classModifiers.length > 0) {
                        for (let i = 0; i < classModifiers.length; i++) {
                            let members = this._guildMembers.filter((x) => x.roles.array().find((role) => role.name.toLowerCase() === classModifiers[i].toLowerCase()));

                            members.forEach((member) => {
                                membersOfClass.push(member.id);
                            })

                            membersOfClass = membersOfClass.concat();

                            if (i === classModifiers.length - 1) {
                                if (i === 0) {
                                    classString += `**${classModifiers[i]}** only)`;
                                } else {
                                    classString += `and **${classModifiers[i]}** only)`;
                                }
                            } else if (i === classModifiers.length - 2) {
                                classString += `**${classModifiers[i]}** `;
                            } else {
                                classString += `**${classModifiers[i]}**, `;
                            }
                        }
                    }

                    if (membersOfClass.length === 0) {
                        classString = '';
                    }
                }

                let activeMembers = new Array<string>();

                let members = this._guildMembers.filter((member) => this._attendanceService.memberShouldBeTracked(member, this._appSettings));

                members.forEach((member) => {
                    activeMembers.push(member.id);
                })

                orderString += orderByOffspecItemScore ? '**offspec ItemScore**' : orderByLastLootDate ? '**last loot date**' : orderByName ? '**name**' : orderByAttendance ? '**attendance**' : orderBySeniority ? '**seniority**' : '**ItemScore**';

                if (message.content.startsWith('/report has')) {
                    if (message.content.match(/"((?:\\.|[^"\\])*)"/)) {
                        let query = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');
                        let itemScores = await this._lootLogService.getItemScores(this._itemScoresChannel);
                        let item = itemScores.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());

                        if (item) {
                            this.sendHasEmbed(item, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message, activeMembers, showInactiveOnly, showAll);
                        } else {
                            let relatedItems = new Array<ItemScore>();

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
                                    this.sendHasEmbed(relatedItems[0], orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message, activeMembers, showInactiveOnly, showAll);
                                } else {
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
                            } else {
                                message.channel.send('Item does not exist.');
                            }
                        }
                    } else {
                        message.channel.send('Invalid query. Ensure the item name is in quotes.');
                    }
                }
                
                else if (message.content.startsWith('/report eligible')) {
                    if (message.content.match(/"((?:\\.|[^"\\])*)"/)) {
                        let query = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');
                        let itemScores = await this._lootLogService.getItemScores(this._itemScoresChannel);
                        let item = itemScores.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());

                        if (item) {
                            this.sendEligibleEmbed(item, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message, activeMembers, showInactiveOnly, showAll);
                        } else {
                            let relatedItems = new Array<ItemScore>();

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
                                    this.sendEligibleEmbed(relatedItems[0], orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate, membersOfClass, orderString, classString, message, activeMembers, showInactiveOnly, showAll);
                                } else {
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
                            } else {
                                message.channel.send('Item does not exist.');
                            }
                        }
                    } else {
                        message.channel.send('Invalid query. Ensure the item name is in quotes.');
                    }
                }

                else if (message.content.startsWith('/report "')) {
                    let memberName = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');

                    let memberArray = new Array<GuildMember | MinimalMember>();
                    memberArray = memberArray.concat(this._guildMembers).concat(this._unfoundMembers);

                    let member = this._memberMatcher.matchMemberFromName(memberArray, memberName);

                    if (member) {
                        let itemsLooted = await this._lootLogService.getLootHistory(member, this._lootLogMap, this._guildMembers);

                        const filteredMap = this._mapSort.filterMembers(this._lootScoreMap, [member.id]);

                        if (Array.from(filteredMap).length > 0) {
                            let title = `Single Member Overview`;

                            message.channel.send(new MinimalVisualizationEmbed(filteredMap, title, true, true));

                            let mainItemsLooted = itemsLooted.filter((item) => !item.value.offspec);
                            let offspecItemsLooted = itemsLooted.filter((item) => item.value.offspec === true);

                            let mainItemsLootedChunked = this.chunk(mainItemsLooted, 30);
                            let offspecItemsLootedChunked = this.chunk(offspecItemsLooted, 30);

                            for (let i = 0; i < mainItemsLootedChunked.length; i++) {
                                message.channel.send(new ItemsLootedExpandedEmbed(mainItemsLootedChunked[i], false, i > 0));
                            }

                            for (let i = 0; i < offspecItemsLootedChunked.length; i++) {
                                message.channel.send(new ItemsLootedExpandedEmbed(offspecItemsLootedChunked[i], true, i > 0));
                            }
                        } else {
                            message.channel.send(`No history found for **${member.displayName}**`);
                        }
                    } else {
                        message.channel.send('Could not find member. Be sure to type the full display name (not case-sensitive).');
                    }
                }

                else if (message.content.startsWith('/report stats')) {
                    let itemCountMap = await this._statsHelper.orderLootedItemsByCount(this._lootScoreMap, this._lootLogDataChannel, members);

                    await message.channel.send(new StatsEmbed(this._lootScoreMap, this._lootLogDataChannel, this._guildMembers, activeMembers, itemCountMap));

                    if (message.content.includes('--all')) {
                        for (let item of itemCountMap) {
                            message.channel.send(`**${item[0]}** - ${item[1]}`);
                        }
                    } else {
                        let fixed = Array.from(itemCountMap);
                        fixed = fixed.splice(0, 20);
                        
                        for (let item of fixed) {
                            message.channel.send(`**${item[0]}** - ${item[1]}`);
                        }

                        message.channel.send('*Top 20 items reported. Include --all to see all.*')
                    }

                }

                else {
                    let sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate);
                    let title = `Overview of active members ${orderString} ${classString}`;

                    if (membersOfClass.length > 0) {
                        sortedMap = this._mapSort.filterMembers(sortedMap, membersOfClass);
                    }

                    if (showInactiveOnly) {
                        sortedMap = this._mapSort.filterOutMembers(sortedMap, activeMembers);
                        title = `Overview of inactive members ${orderString} ${classString}`;
                    }

                    if (showAll) {
                        title = `Overview of all members ${orderString} ${classString}`;
                    }

                    if (!showAll && !showInactiveOnly) {
                        sortedMap = this._mapSort.filterMembers(sortedMap, activeMembers);
                    }

                    let mapChunked = this.chunk(Array.from(sortedMap), 15);

                    for (let i = 0; i < mapChunked.length; i++) {
                        let first = i === 0;
                        let last = i === mapChunked.length - 1;
                        message.channel.send(new MinimalVisualizationEmbed(mapChunked[i], title, first, last));
                    }

                    if (mapChunked.length === 0) {
                        message.channel.send('No members found matching query.');
                    }
                }
            }

            if (message.content === '/lastraid' && (this.isAdminChannel(message) || message.channel.type === 'dm')) {
                await this.ensureHasDataMaps();

                let lastAttendance = await this._messages.getLast(this._attendanceLogDataChannel);

                if (lastAttendance) {
                    let cleanString = lastAttendance.content.replace(/`/g, '');

                    if (cleanString.length > 0) {
                        let attendance: LootScoreData<[string, number][]> = JSON.parse(cleanString);
                        let date = attendance.signature.timestamp.slice(0, 10);
                        let formattedDate = new Date(attendance.signature.timestamp).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' });

                        let lootArray = Array.from(this._lootLogMap.entries())
                        let itemsLooted = new Array<LootScoreData<AwardedItem>>();

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
                            message.channel.send(new LastRaidLootEmbed(itemsLootedChunked[i], first, last));
                        }

                        message.channel.send(new LastRaidAttendanceEmbed(attendance, this._guildMembers));

                    } else {
                        message.channel.send('Raid not found.');
                    }
                } else {
                    message.channel.send('Raid not found.');
                }
            }

            if ((message.content.startsWith('/g ') || message.content.startsWith('/give')) && this.canUseCommands(message)) {
                let member: GuildMember;
                let query = '';

                if (this.isFeedChannel(message)) {
                    member = message.mentions.members.array()[0];
                    query = message.content.replace('/give ', '').replace('/g', '').replace(/(@\S+)/, '').replace('--offspec', '').replace('--os', '').replace('--existing', '').replace('<', '').trim();
                }

                if (this.isAdminChannel(message)) {
                    if (!this._guildMembers) {
                        this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                    }

                    let memberName = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');
                    member = this._memberMatcher.matchMemberFromName(this._guildMembers, memberName) as GuildMember;
                    query = message.content.replace('/give ', '').replace('/g', '').replace(memberName, '').replace(/"/g, '').replace('--offspec', '').replace('--os', '').replace('--existing', '').replace('<', '').trim();
                }

                let offspec = message.content.includes('--offspec') || message.content.includes('--os');
                let existing = message.content.includes('--existing');

                if (member) {
                    this._lootLogService.getItemScores(this._itemScoresChannel).then((array) => {
                        let item = array.find((x) => x.shorthand.toLowerCase() === query.toLowerCase() || x.displayName.toLowerCase() === query.toLowerCase());

                        if (item) {
                            this.manageAwardMessage(message, member, item, offspec, existing);

                        } else {
                            let relatedItems = new Array<ItemScore>();

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

                                } else {
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
                            } else {
                                message.channel.send('Item does not exist.');
                            }
                        }
                    });
                } else {
                    if (this.isFeedChannel(message)) {
                        message.channel.send('Could not find member. Be sure to use a @mention.');
                    }

                    if (this.isAdminChannel(message)) {
                        message.channel.send('Could not find member. Be sure to use quotes around the member name when requesting in the admin channel.');
                    }
                }
            }

            if (message.content.startsWith('/getitemscores') && this.canUseCommands(message) && this.isItemScoresChannel(message)) {
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
                                this._itemScoresChannel.send(`${result[0]}  |  ${result[1]}  |  ${result[2]}  |  ${result[3].replace(/ /g, '').replace(/,/g, ', ')}`);
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
                await this.backUpValues();
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

            if (message.content.startsWith('/clear --attendance') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                let memberName = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');

                let memberArray = new Array<GuildMember | MinimalMember>();
                memberArray = memberArray.concat(this._guildMembers).concat(this._unfoundMembers);

                let member = this._memberMatcher.matchMemberFromName(memberArray, memberName);

                if (member) {
                    message.channel.send(`Are you sure you want to clear attendance/seniority for **${member.displayName}**? This request is not (easily) reversible.`).then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage as Message, message);

                        (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    message.channel.send(`Clearing past entries for **${member.displayName}**. This could take a while . . .`);

                                    this.clearPastAttendance(member, message);
                                } else {
                                    message.channel.send('Request to clear attendance aborted.');
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                message.channel.send('No reply received. Request to clear attendance aborted.');
                            });
                    });

                } else {
                    message.channel.send('Could not find member. Be sure to type the full display name (not case-sensitive).');
                }
            }

        });
    }

    private get presentMembers(): GuildMember[] {
        return Array.from(this._raidChannel1.members.values()).concat(Array.from(this._raidChannel2.members.values()));
    }

    private async canUseCommands(message: Message): Promise<boolean> {
        let member = message.member;
        if (!member) {
            member = await message.guild.fetchMember(message.author.id);
        }
        return member.roles.some((role) => role.id === this._appSettings['leadership'] || message.author.id === this._appSettings['admin']);
    }

    private isAdminChannel(message: Message): boolean {
        return message.channel.id === this._adminChannel.id;
    }
    
    private isItemScoresChannel(message: Message): boolean {
        return message.channel.id === this._itemScoresChannel.id;
    }
    
    private isFeedChannel(message: Message): boolean {
        return message.channel.id === this._feedChannel.id;
    }

    private manageAwardMessage(message: Message, member: GuildMember, item: ItemScore, offspec: boolean, existing: boolean, flags = new Array<string>()): void {
        let extras = '';

        if (existing) {
            extras = ' (existing)';
        } else if (offspec) {
            extras = ' (offspec)';
        }

        message.channel.send(`Do you wish to award ${member.displayName} **${item.displayName}**${extras}? Please confirm.`).then((sentMessage) => {
            const filter = this.setReactionFilter(sentMessage as Message, message);

            (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                .then((collected) => {
                    if (collected.first().emoji.name === '✅') {
                        this._lootLogService.awardItem(message, this._lootLogDataChannel, this._lootLogChannel, item, member, offspec, existing, flags, this.addItemToLootLogMap.bind(this, member));
                        this.refreshLootScoreMap();
                    } else {
                        message.channel.send('Request to award item aborted.');
                    }
                })
                .catch((err) => {
                    console.log(err);
                    message.channel.send(`No reply received. Request to award ${member.displayName} **${item.displayName}**${extras} aborted.`);
                });
        });
    }

    private async sendHasEmbed(
        item: ItemScore,
        orderByName: boolean,
        orderByAttendance: boolean,
        orderBySeniority: boolean,
        orderByOffspecItemScore: boolean,
        orderByLastLootDate: boolean,
        membersOfClass: string[],
        orderString: string,
        classString: string,
        message: Message,
        activeMembers: string[],
        showInactiveOnly: boolean,
        showAll: boolean): Promise<void> {

        let memberArray = new Array<GuildMember | MinimalMember>();
        memberArray = memberArray.concat(this._guildMembers).concat(this._unfoundMembers);

        let membersWhoHave = await this._lootLogService.getHasLooted(item, this._lootLogMap, memberArray);

        if (membersWhoHave.length > 0) {
            let lootScoreHasMap = this._lootScoreMap;

            for (let entry of lootScoreHasMap) {
                entry[1].lastLootDate = this._lootScoreService.getLastLootDateForItem(this._lootLogMap, item, entry[0]) || '---';
            }

            let sortedMap = this._mapSort.sortByFlag(lootScoreHasMap, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate);
            let filteredMap = this._mapSort.filterMembers(sortedMap, membersWhoHave);
            let title = `Active members who have **${item.displayName}** ${orderString} ${classString}`;

            if (membersOfClass.length > 0) {
                filteredMap = this._mapSort.filterMembers(filteredMap, membersOfClass);
            }

            if (showInactiveOnly) {
                filteredMap = this._mapSort.filterOutMembers(filteredMap, activeMembers);
                title = `Inactive members who have **${item.displayName}** ${orderString} ${classString}`;
            }

            if (showAll) {
                title = `All members who have **${item.displayName}** ${orderString} ${classString}`;
            } 

            if (!showAll && !showInactiveOnly) {
                filteredMap = this._mapSort.filterMembers(filteredMap, activeMembers);
            }
            
            let mapChunked = this.chunk(Array.from(filteredMap), 15);

            for (let i = 0; i < mapChunked.length; i++) {
                let first = i === 0;
                let last = i === mapChunked.length - 1;
                message.channel.send(new MinimalVisualizationEmbed(mapChunked[i], title, first, last, item));
            }

            if (mapChunked.length === 0) {
                message.channel.send('No members found matching query.');
            }

        } else {
            message.channel.send(`No members have **${item.displayName}**.`);
        }
    }

    private async sendEligibleEmbed(
        item: ItemScore,
        orderByName: boolean,
        orderByAttendance: boolean,
        orderBySeniority: boolean,
        orderByOffspecItemScore: boolean,
        orderByLastLootDate: boolean,
        membersOfClass: string[],
        orderString: string,
        classString: string,
        message: Message,
        activeMembers: string[],
        showInactiveOnly: boolean,
        showAll: boolean): Promise<void> {

        let memberArray = new Array<GuildMember | MinimalMember>();
        memberArray = memberArray.concat(this._guildMembers).concat(this._unfoundMembers);

        let membersWhoNeed = await this._lootLogService.getEligibleMembers(item, this._lootLogMap, memberArray)

        if (membersWhoNeed.length > 0) {
            let sortedMap = this._mapSort.sortByFlag(this._lootScoreMap, orderByName, orderByAttendance, orderBySeniority, orderByOffspecItemScore, orderByLastLootDate);
            let filteredMap = this._mapSort.filterMembers(sortedMap, membersWhoNeed);
            let title = `Active members who need **${item.displayName}** ${orderString} ${classString}`;

            if (membersOfClass.length > 0) {
                filteredMap = this._mapSort.filterMembers(filteredMap, membersOfClass);
            }

            if (showInactiveOnly) {
                filteredMap = this._mapSort.filterOutMembers(filteredMap, activeMembers);
                title = `Inactive members who need **${item.displayName}** ${orderString} ${classString}`;
            }

            if (showAll) {
                title = `All members who need **${item.displayName}** ${orderString} ${classString}`;
            } 

            if (!showAll && !showInactiveOnly) {
                filteredMap = this._mapSort.filterMembers(filteredMap, activeMembers);
            }

            let mapChunked = this.chunk(Array.from(filteredMap), 15);

            for (let i = 0; i < mapChunked.length; i++) {
                let first = i === 0;
                let last = i === mapChunked.length - 1;
                message.channel.send(new MinimalVisualizationEmbed(mapChunked[i], title, first, last));
            }

            if (mapChunked.length === 0) {
                message.channel.send('No members found matching query.');
            }
        } else {
            message.channel.send(`No members need **${item.displayName}**.`);
        }
    }

    public async updateAttendanceChart(): Promise<void> {
        await this.refreshDataMaps();

        const sortedMap = this._mapSort.sortByName(this._lootScoreMap);

        this._lootScoreDailyDumpChannel.fetchMessages({ limit: 100 })
            .then(messages => this._lootScoreDailyDumpChannel.bulkDelete(messages));

        for (let entry of sortedMap) {
            if (entry[0] instanceof GuildMember) {
                if (entry[0].roles.array().find((x) => x.id === this._appSettings['leadership'] || x.id === this._appSettings['raider'] || x.id === this._appSettings['applicant'])) {
                    this._lootScoreDailyDumpChannel.send(new PublicAttendanceEmbed(entry, this._appSettings));
                }
            }
        }

        this.backUpValues();
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
                            this.refreshDataMaps();
                        }).catch((err) => {
                            console.log(err);
                            message.channel.send('Message update failed. Try again.');
                        });
                    }).catch((err) => {
                        console.log(err);
                        message.channel.send('Too slow. Try again.');
                    });
                });
            } else {
                matchingMessages.length === 0 ? message.channel.send('No matching message found. If you aren\'t already, try including the full timestamp.') : message.channel.send('Too many matching messages found. Try entering the full message body.');
            }
        });
    }

    public async clearPastAttendance(member: GuildMember | MinimalMember, message: Message): Promise<void> {
        let seniorityLog: Message[] = await this._messages.getMessages(this._seniorityLogDataChannel);
        let attendanceLog: Message[] = await this._messages.getMessages(this._attendanceLogDataChannel);

        for (let message of seniorityLog) {
            let editedMessage = message.content.replace(`["${member.id}"`, `["CLEARED-${member.id}"`);
            await message.edit(editedMessage);
        }

        for (let message of attendanceLog) {
            let editedMessage = message.content.replace(`["${member.id}"`, `["CLEARED-${member.id}"`);
            await message.edit(editedMessage);
        }

        message.channel.send('Attendance successfully cleared.');

        this.refreshDataMaps();
    }

    public async backUpValues(): Promise<void> {
        await this.refreshDataMaps();

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

    public async addItemToLootLogMap(member: GuildMember, lootScoreData: LootScoreData<any>): Promise<void> {
        if (!this._guildMembers) {
            this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
        }

        let memberLootScoreData = this._lootLogMap.get(member);
        memberLootScoreData.push(lootScoreData);

        this._lootLogMap = this._lootLogMap.set(member, memberLootScoreData);
    }
        
    public async refreshLootLogMap(): Promise<void> {
        if (!this._guildMembers) {
            this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
        }

        this._lootLogMap = await this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers);
    }
        
    public async refreshLootScoreMap(): Promise<void> {
        if (!this._guildMembers) {
            this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
        }

        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._seniorityMap, this._lootLogMap);
    }

    public async refreshDataMaps(): Promise<void> {
        this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
        let attendanceMapId = await this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel);
        this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
        let seniorityMapId = await this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel);
        this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
        this._lootLogMap = await this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers);
        this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._seniorityMap, this._lootLogMap);
        this._unfoundMembers = this.getUnfoundMembers(this._lootLogMap);
    }

    public async ensureHasDataMaps(): Promise<void> {
        if (!this._guildMembers) {
            this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
        }

        if (!this._attendanceMap) {
            let attendanceMapId = await this._lootScoreService.getAttendanceMap(this._attendanceLogDataChannel);
            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
        }

        if (!this._seniorityMap) {
            let seniorityMapId = await this._lootScoreService.getSeniorityMap(this._seniorityLogDataChannel);
            this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
        }

        if (!this._lootLogMap) {
            this._lootLogMap = await this._lootLogService.createLootLogMap(this._lootLogDataChannel, this._guildMembers);
        }

        if (!this._lootScoreMap) {
            this._lootScoreMap = this._lootScoreService.createLootScoreMap(this._attendanceMap, this._seniorityMap, this._lootLogMap);
        }

        if (!this._unfoundMembers) {
            this._unfoundMembers = this.getUnfoundMembers(this._lootLogMap);
        }
    }

    public chunk(arr, chunkSize) {
        var R = [];
        for (var i = 0, len = arr.length; i < len; i += chunkSize)
            R.push(arr.slice(i, i + chunkSize));
        return R;
    }

    private getUnfoundMembers(lootLogMap: Map<GuildMember | MinimalMember, LootScoreData<AwardedItem>[]>): MinimalMember[] {
        let unfoundMembers = new Array<MinimalMember>();

        for (let entry of Array.from(lootLogMap)) {
            if (entry[0] instanceof MinimalMember) {
                unfoundMembers.push(entry[0] as MinimalMember);
            }
        }

        return unfoundMembers;
    }
}

export const classes = ['paladin', 'ret', 'rogue', 'prot', 'fury', 'mage', 'druid', 'feral', 'balance', 'hunter', 'priest', 'shadow', 'warlock'];