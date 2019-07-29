"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed_helper_1 = require("../Helpers/embed.helper");
class SeniorityEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap, memberEntry) {
        super();
        this._embedHelper = new embed_helper_1.EmbedHelper();
        this.addMember(memberEntry);
    }
    getHighestDisplayRole(member) {
        if (member.roles.array().find((x) => x.name === 'Leadership')) {
            return 'Leadership';
        }
        else if (member.roles.array().find((x) => x.name === 'Raider')) {
            return 'Raider';
        }
        else if (member.roles.array().find((x) => x.name === 'Applicant')) {
            return 'Applicant';
        }
        else if (member.roles.array().find((x) => x.name === 'Community')) {
            return 'Community';
        }
        else {
            return 'Role not set';
        }
    }
    addMember(member) {
        this.addField(member[0].displayName, this.getHighestDisplayRole(member[0]), true);
        this.addField(`${member[1].attendancePercentage || 0}%`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`${member[1].seniorityPercentage || 0}%`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}
exports.SeniorityEmbed = SeniorityEmbed;
