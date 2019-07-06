"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed_helper_1 = require("../Helpers/embed.helper");
class SeniorityEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap) {
        super();
        this._embedHelper = new embed_helper_1.EmbedHelper();
        for (let member of lootScoreMap) {
            this.addMember(member);
        }
    }
    addMember(member) {
        this.addField(member[0].displayName, member[0].highestRole.name, true);
        this.addField(`${member[1].attendancePercentage}%`, this._embedHelper.getBar(member[1].attendancePercentage), true);
        this.addField(`${member[1].seniorityPercentage}%`, this._embedHelper.getBar(member[1].seniorityPercentage), true);
    }
}
exports.SeniorityEmbed = SeniorityEmbed;
