import { Client, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import * as fs from 'fs';
import { PublicAttendanceEmbed } from './Embeds/public-attendance.embed';
import { MapSortHelper } from './Helpers/map-sort.helper';
import { MemberMatchHelper } from './Helpers/member-match.helper';
import { MessagesHelper } from './Helpers/messages.helper';
import { MemberAttendance, MinimalMember } from './Models/AttendanceData';
import { AttendanceService } from './Services/attendance.service';
import { AttendanceDataService } from './Services/attendance-data.service';
import { TimestampHelper } from './Helpers/timestamp.helper';

export class AttendanceBot {
    private _client = new Client();

    private _attendanceChannels: VoiceChannel[];
    private _attendanceLogChannel: TextChannel;
    private _attendanceLogDataChannel: TextChannel;
    private _seniorityLogDataChannel: TextChannel;
    private _attendanceViewChannel: TextChannel;
    private _adminChannel: TextChannel;
    private _publicChannel: TextChannel;

    private _attendanceService: AttendanceService = new AttendanceService();
    private _attendanceDataService: AttendanceDataService = new AttendanceDataService();
    private _memberMatcher: MemberMatchHelper = new MemberMatchHelper();
    private _mapSort: MapSortHelper = new MapSortHelper();
    private _messages: MessagesHelper = new MessagesHelper();
    private _timestamp: TimestampHelper = new TimestampHelper();

    private _seniorityMap: Map<GuildMember, number>;
    private _attendanceMap: Map<GuildMember, number[]>;
    private _attendanceDataMap: Map<GuildMember | MinimalMember, MemberAttendance>;

    private _guildMembers: GuildMember[];

    private _appSettings;

    public start(appSettings): void {
        this._appSettings = appSettings;

        this._client.login(appSettings["token"]);
        this._client.once('ready', () => {
            console.log('Ready!');

            this._attendanceChannels = new Array<VoiceChannel>();

            for (let channelId of Object.entries(appSettings['attendanceChannels'])) {
                var channel = this._client.channels.get(channelId[1] as string) as VoiceChannel;
                if (channel) {
                    this._attendanceChannels.push(channel);
                }
            }

            this._attendanceViewChannel = this._client.channels.get(appSettings['attendanceViewChannel']) as TextChannel;
            this._seniorityLogDataChannel = this._client.channels.get(appSettings['seniorityLogDataChannel']) as TextChannel;
            this._attendanceLogDataChannel = this._client.channels.get(appSettings['attendanceLogDataChannel']) as TextChannel;
            this._attendanceLogChannel = this._client.channels.get(appSettings['attendanceLogChannel']) as TextChannel;
            this._adminChannel = this._client.channels.get(appSettings['adminChannel']) as TextChannel;
            this._publicChannel = this._client.channels.get(appSettings['publicChannel']) as TextChannel;

            var CronJob = require('cron').CronJob;
            var job = new CronJob('00 00 00 * * *', () => {
                this.backUpValues();
            }, null, true, 'America/Los_Angeles');

            job.start();

            this.refreshDataMaps();
        });

        this._client.on('message', async message => {
            if (message.content === '/refreshpublic' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this.updateAttendanceChart();
            }
            
            if (message.content === '/refreshinternal' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                await this.refreshDataMaps();
                message.channel.send('Refreshed data.');
            }
            
            if (message.content === '/refreshmembers' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                message.channel.send('Refreshed guild members.');
            }

            if ((message.content === '/start' || message.content === '/s') && this.canUseCommands(message) && this.isPublicChannel(message)) {
                if (this.membersInAttendanceChannels) {
                    message.channel.send('Do you wish to start logging? Please confirm.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage as Message, message);

                        (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    this._attendanceService.startLogging(message, this._attendanceChannels, this._appSettings);
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

            if ((message.content === '/end' || message.content === '/e') && this.canUseCommands(message) && this.isPublicChannel(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage as Message, message);

                        (sentMessage as Message).awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                                if (collected.first().emoji.name === '✅') {
                                    message.channel.send('*Saving attendance . . .*');
                                    this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();

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
                    message.channel.send(`Did you mean to start attendance first? (Hint: /start)`);
                }
            }

            if ((message.content === '/end --nolog' || message.content === '/e --nolog') && this.canUseCommands(message) && this.isPublicChannel(message)) {
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
                    message.channel.send(`Did you mean to start attendance first? (Hint: /start)`);
                }
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
            
            if (message.content.startsWith('/clear --attendance') && this.canUseCommands(message) && this.isAdminChannel(message)) {
                let memberName = message.content.match(/"((?:\\.|[^"\\])*)"/)[0].replace(/"/g, '');

                let memberArray = new Array<GuildMember | MinimalMember>();
                memberArray = memberArray.concat(this._guildMembers);

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

    private get membersInAttendanceChannels(): boolean {
        for (let channel of this._attendanceChannels) {
            if (Array.from(channel.members.values()).length > 0) {
                return true;
            }
        }
    }

    private get presentMembers(): GuildMember[] {
        let members = new Array<GuildMember>();
        for (let channel of this._attendanceChannels) {
            members.concat(Array.from(channel.members.values()))
        }
        return members;
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
    
    private isPublicChannel(message: Message): boolean {
        return message.channel.id === this._publicChannel.id;
    }

    public async updateAttendanceChart(): Promise<void> {
        await this.refreshDataMaps();

        const sortedMap = this._mapSort.sortByName(this._attendanceDataMap);

        this._attendanceViewChannel.fetchMessages({ limit: 100 })
            .then(messages => this._attendanceViewChannel.bulkDelete(messages));

        for (let entry of sortedMap) {
            if (entry[0] instanceof GuildMember) {
                let shouldLog;
                
                for (let role of Object.entries(this._appSettings['loggableRoles'])) {
                    if (entry[0].roles.array().find((x) => x.id === role[1])) {
                        shouldLog = true;
                    }
                }

                if (shouldLog) {
                    this._attendanceViewChannel.send(new PublicAttendanceEmbed(entry, this._appSettings));
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
        let attendanceMapId = await this._attendanceDataService.getAttendanceMap(this._attendanceLogDataChannel);
        this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
        let seniorityMapId = await this._attendanceDataService.getSeniorityMap(this._seniorityLogDataChannel);
        this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
        this._attendanceDataMap = this._attendanceDataService.createAttendanceDataMap(this._attendanceMap, this._seniorityMap);
    }

    public async ensureHasDataMaps(): Promise<void> {
        if (!this._guildMembers) {
            this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
        }

        if (!this._attendanceMap) {
            let attendanceMapId = await this._attendanceDataService.getAttendanceMap(this._attendanceLogDataChannel);
            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
        }

        if (!this._seniorityMap) {
            let seniorityMapId = await this._attendanceDataService.getSeniorityMap(this._seniorityLogDataChannel);
            this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
        }

        if (!this._attendanceDataMap) {
            this._attendanceDataMap = this._attendanceDataService.createAttendanceDataMap(this._attendanceMap, this._seniorityMap);
        }
    }
}
