"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class LootLogEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreData) {
        super();
        this.lootScoreData = lootScoreData;
        this.setColor('#60b5bc');
        if (lootScoreData.value.existing) {
            this.addField(lootScoreData.value.member.displayName, `**${lootScoreData.value.item.displayName}** (existing)`);
        }
        else if (lootScoreData.value.offspec) {
            this.addField(lootScoreData.value.member.displayName, `**${lootScoreData.value.item.displayName}** (offspec)`);
        }
        else {
            this.addField(lootScoreData.value.member.displayName, `**${lootScoreData.value.item.displayName}**`);
        }
        this.setFooter(`Awarded by ${lootScoreData.signature.requester.displayName} on ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' })}`);
    }
}
exports.LootLogEmbed = LootLogEmbed;
