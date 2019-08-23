"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class StatsEmbed extends discord_js_1.RichEmbed {
    constructor(lootScore) {
        super();
        this.lootScore = lootScore;
        this.setColor('#60b5bc');
        this.addField(`Stats for **${lootScore[0].displayName}**`, `**Attendance**: ${lootScore[1].attendancePercentage}%\n**Seniority**: ${lootScore[1].seniorityPercentage}%\n**Last Loot Date**: ${lootScore[1].lastLootDate}\n`);
    }
}
exports.StatsEmbed = StatsEmbed;
