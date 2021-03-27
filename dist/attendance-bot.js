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
const fs = require("fs");
const public_attendance_embed_1 = require("./Embeds/public-attendance.embed");
const map_sort_helper_1 = require("./Helpers/map-sort.helper");
const member_match_helper_1 = require("./Helpers/member-match.helper");
const messages_helper_1 = require("./Helpers/messages.helper");
const attendance_service_1 = require("./Services/attendance.service");
const attendance_data_service_1 = require("./Services/attendance-data.service");
const timestamp_helper_1 = require("./Helpers/timestamp.helper");
class AttendanceBot {
    constructor() {
        this._client = new discord_js_1.Client();
        this._attendanceService = new attendance_service_1.AttendanceService();
        this._attendanceDataService = new attendance_data_service_1.AttendanceDataService();
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
            this._attendanceChannels = new Array();
            for (let channelId of Object.entries(appSettings['attendanceChannels'])) {
                var channel = this._client.channels.get(appSettings['attendanceChannels'][channelId[1]]);
                if (channel) {
                    this._attendanceChannels.push(channel);
                }
            }
            this._seniorityLogDataChannel = this._client.channels.get(appSettings['seniorityLogDataChannel']);
            this._attendanceLogDataChannel = this._client.channels.get(appSettings['attendanceLogDataChannel']);
            this._attendanceLogChannel = this._client.channels.get(appSettings['attendanceLogChannel']);
            this._adminChannel = this._client.channels.get(appSettings['adminChannel']);
            this._publicChannel = this._client.channels.get(appSettings['publicChannel']);
            var CronJob = require('cron').CronJob;
            var job = new CronJob('00 00 00 * * *', () => {
                this.backUpValues();
            }, null, true, 'America/Los_Angeles');
            job.start();
            this.refreshDataMaps();
        });
        this._client.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
            if (message.content === '/refreshpublic' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this.updateAttendanceChart();
            }
            if (message.content === '/refreshinternal' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                yield this.refreshDataMaps();
                message.channel.send('Refreshed data.');
            }
            if (message.content === '/refreshmembers' && this.canUseCommands(message) && this.isAdminChannel(message)) {
                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                message.channel.send('Refreshed guild members.');
            }
            if ((message.content === '/s' || message.content === '/start') && this.canUseCommands(message) && this.isPublicChannel(message)) {
                if (this.membersInAttendanceChannels) {
                    message.channel.send('Do you wish to start logging? Please confirm.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
                        sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                            if (collected.first().emoji.name === '✅') {
                                this._attendanceService.startLogging(message, this._attendanceChannels, this._appSettings);
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
            if ((message.content === '/end' || message.content === '/e') && this.canUseCommands(message) && this.isPublicChannel(message)) {
                if (this._attendanceService.loggingInProgress) {
                    message.channel.send('Are you ready to end logging? This command will end logging and submit all values.').then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
                        sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                            if (collected.first().emoji.name === '✅') {
                                message.channel.send('*Saving attendance . . .*');
                                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
                                this._attendanceService.endLogging(message, this._seniorityLogDataChannel, this._attendanceLogDataChannel, this._attendanceLogChannel, this._guildMembers, this._appSettings, true, this.updateAttendanceChart.bind(this));
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
            if ((message.content === '/end --nolog' || message.content === '/e --nolog') && this.canUseCommands(message) && this.isPublicChannel(message)) {
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
                yield this.backUpValues();
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
                let memberArray = new Array();
                memberArray = memberArray.concat(this._guildMembers);
                let member = this._memberMatcher.matchMemberFromName(memberArray, memberName);
                if (member) {
                    message.channel.send(`Are you sure you want to clear attendance/seniority for **${member.displayName}**? This request is not (easily) reversible.`).then((sentMessage) => {
                        const filter = this.setReactionFilter(sentMessage, message);
                        sentMessage.awaitReactions(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then((collected) => {
                            if (collected.first().emoji.name === '✅') {
                                message.channel.send(`Clearing past entries for **${member.displayName}**. This could take a while . . .`);
                                this.clearPastAttendance(member, message);
                            }
                            else {
                                message.channel.send('Request to clear attendance aborted.');
                            }
                        })
                            .catch((err) => {
                            console.log(err);
                            message.channel.send('No reply received. Request to clear attendance aborted.');
                        });
                    });
                }
                else {
                    message.channel.send('Could not find member. Be sure to type the full display name (not case-sensitive).');
                }
            }
        }));
    }
    get membersInAttendanceChannels() {
        for (let channel of this._attendanceChannels) {
            if (Array.from(channel.members.values()).length > 0) {
                return true;
            }
        }
    }
    get presentMembers() {
        let members = new Array();
        for (let channel of this._attendanceChannels) {
            members.concat(Array.from(channel.members.values()));
        }
        return members;
    }
    canUseCommands(message) {
        return __awaiter(this, void 0, void 0, function* () {
            let member = message.member;
            if (!member) {
                member = yield message.guild.fetchMember(message.author.id);
            }
            return member.roles.some((role) => role.id === this._appSettings['leadership'] || message.author.id === this._appSettings['admin']);
        });
    }
    isAdminChannel(message) {
        return message.channel.id === this._adminChannel.id;
    }
    isPublicChannel(message) {
        return message.channel.id === this._publicChannel.id;
    }
    updateAttendanceChart() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.refreshDataMaps();
            const sortedMap = this._mapSort.sortByName(this._attendanceDataMap);
            this._attendanceViewChannel.fetchMessages({ limit: 100 })
                .then(messages => this._attendanceViewChannel.bulkDelete(messages));
            for (let entry of sortedMap) {
                if (entry[0] instanceof discord_js_1.GuildMember) {
                    if (entry[0].roles.array().find((x) => x.id === this._appSettings['leadership'] || x.id === this._appSettings['raider'] || x.id === this._appSettings['applicant'])) {
                        this._attendanceViewChannel.send(new public_attendance_embed_1.PublicAttendanceEmbed(entry, this._appSettings));
                    }
                }
            }
            this.backUpValues();
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
            }
            else {
                matchingMessages.length === 0 ? message.channel.send('No matching message found. If you aren\'t already, try including the full timestamp.') : message.channel.send('Too many matching messages found. Try entering the full message body.');
            }
        });
    }
    clearPastAttendance(member, message) {
        return __awaiter(this, void 0, void 0, function* () {
            let seniorityLog = yield this._messages.getMessages(this._seniorityLogDataChannel);
            let attendanceLog = yield this._messages.getMessages(this._attendanceLogDataChannel);
            for (let message of seniorityLog) {
                let editedMessage = message.content.replace(`["${member.id}"`, `["CLEARED-${member.id}"`);
                yield message.edit(editedMessage);
            }
            for (let message of attendanceLog) {
                let editedMessage = message.content.replace(`["${member.id}"`, `["CLEARED-${member.id}"`);
                yield message.edit(editedMessage);
            }
            message.channel.send('Attendance successfully cleared.');
            this.refreshDataMaps();
        });
    }
    backUpValues() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.refreshDataMaps();
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
            this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
            let attendanceMapId = yield this._attendanceDataService.getAttendanceMap(this._attendanceLogDataChannel);
            this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
            let seniorityMapId = yield this._attendanceDataService.getSeniorityMap(this._seniorityLogDataChannel);
            this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
            this._attendanceDataMap = this._attendanceDataService.createAttendanceDataMap(this._attendanceMap, this._seniorityMap);
        });
    }
    ensureHasDataMaps() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._guildMembers) {
                this._guildMembers = this._client.guilds.get(this._appSettings['server']).members.array();
            }
            if (!this._attendanceMap) {
                let attendanceMapId = yield this._attendanceDataService.getAttendanceMap(this._attendanceLogDataChannel);
                this._attendanceMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, attendanceMapId);
            }
            if (!this._seniorityMap) {
                let seniorityMapId = yield this._attendanceDataService.getSeniorityMap(this._seniorityLogDataChannel);
                this._seniorityMap = this._memberMatcher.replaceMemberIdWithMember(this._guildMembers, seniorityMapId);
            }
            if (!this._attendanceDataMap) {
                this._attendanceDataMap = this._attendanceDataService.createAttendanceDataMap(this._attendanceMap, this._seniorityMap);
            }
        });
    }
}
exports.AttendanceBot = AttendanceBot;
