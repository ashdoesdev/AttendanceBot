"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed_helper_1 = require("../Helpers/embed.helper");
class PublicAttendanceEmbed extends discord_js_1.RichEmbed {
    constructor(memberEntry, appSettings) {
        super();
        this._embedHelper = new embed_helper_1.EmbedHelper();
        this._appSettings = appSettings;
        this.addMember(memberEntry);
    }
    getHighestDisplayRole(member) {
        if (member.roles.array().find((x) => x.id === this._appSettings['leadership'])) {
            return 'Leadership';
        }
        else if (member.roles.array().find((x) => x.id === this._appSettings['raider'])) {
            return 'Raider';
        }
        else if (member.roles.array().find((x) => x.id === this._appSettings['applicant'])) {
            return 'Applicant';
        }
        else {
            return 'Role not set';
        }
    }
    addMember(member) {
        this.setColor('#60b5bc');
        this.setAuthor(member[0].displayName, member[0].user.avatarURL);
        this.setDescription(member[0].roles.array().filter((x) => x.id !== this._appSettings['everyone'] &&
            x.id !== this._appSettings['announcements'] &&
            x.id !== this._appSettings['strategist'] &&
            x.id !== this._appSettings['lolers'] &&
            x.id !== this._appSettings['bossman'] &&
            x.id !== this._appSettings['booster'] &&
            x.id !== this._appSettings['boostie'] &&
            x.id !== this._appSettings['newrole'] &&
            x.id !== this._appSettings['botadmin'] &&
            x.id !== this._appSettings['discordadmin']).join(' '));
        this.addField(`**${member[1].attendancePercentage || 0}%** attendance`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`**${member[1].seniorityPercentage || 0}%** seniority`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}
exports.PublicAttendanceEmbed = PublicAttendanceEmbed;
