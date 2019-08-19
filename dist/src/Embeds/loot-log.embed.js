"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const timestamp_helper_1 = require("../Helpers/timestamp.helper");
class LootLogEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreData) {
        super();
        this.lootScoreData = lootScoreData;
        this._timestampHelper = new timestamp_helper_1.TimestampHelper();
        this.setColor('#60b5bc');
        if (!lootScoreData.value.offspec) {
            this.addField(lootScoreData.value.member.displayName, `**${lootScoreData.value.item.displayName}**`);
        }
        else {
            this.addField(lootScoreData.value.member.displayName, `**${lootScoreData.value.item.displayName}** (offspec)`);
        }
        this.setFooter(`Awarded by ${lootScoreData.signature.requester} on ${this._timestampHelper.monthDayYearFormatted}`);
    }
}
exports.LootLogEmbed = LootLogEmbed;
