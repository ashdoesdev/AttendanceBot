"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed_helper_1 = require("../Helpers/embed.helper");
class DetailedVisualizationEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap, memberEntry) {
        super();
        this._embedHelper = new embed_helper_1.EmbedHelper();
        this._highestLootScore = this.findHighestLootScore(lootScoreMap);
        this.addMember(memberEntry);
    }
    addMember(member) {
        let role = 'Role not found';
        if (member[0].highestRole) {
            role = member[0].highestRole.name;
        }
        let name = 'Member not found';
        if (member[0].displayName) {
            name = member[0].displayName;
        }
        this.setColor('#60b5bc');
        this.addField(name, role, true);
        this.addField(`${member[1].attendancePercentage}%`, this._embedHelper.getBar(member[1].attendancePercentage), true);
        this.addField(`${member[1].lootScore}`, this._embedHelper.getBar(this.lootScorePercentage(member[1].lootScore)), true);
    }
    findHighestLootScore(lootScoreMap) {
        let highest = 0;
        for (let entry of lootScoreMap) {
            if (entry[1].lootScore > highest) {
                highest = entry[1].lootScore;
            }
        }
        return highest;
    }
    lootScorePercentage(lootScore) {
        return Math.ceil((lootScore / this._highestLootScore) * 100);
    }
}
exports.DetailedVisualizationEmbed = DetailedVisualizationEmbed;
