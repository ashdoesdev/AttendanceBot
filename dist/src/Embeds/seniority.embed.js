"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed_helper_1 = require("../Helpers/embed.helper");
class SeniorityEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap, memberEntry, appSettings) {
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
        this.addField(member[0].displayName, this.getHighestDisplayRole(member[0]), true);
        this.addField(`${member[1].attendancePercentage || 0}%`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`${member[1].seniorityPercentage || 0}%`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}
exports.SeniorityEmbed = SeniorityEmbed;
