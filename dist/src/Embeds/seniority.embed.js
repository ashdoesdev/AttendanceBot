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
    addMember(member) {
        this.addField(member[0].displayName, member[0].highestRole.name, true);
        this.addField(`${member[1].attendancePercentage || 0}%`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`${member[1].seniorityPercentage || 0}%`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}
exports.SeniorityEmbed = SeniorityEmbed;
