"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const timestamp_helper_1 = require("../Helpers/timestamp.helper");
class LootLogEmbed extends discord_js_1.RichEmbed {
    constructor(itemScore, name) {
        super();
        this.itemScore = itemScore;
        this.name = name;
        this._timestampHelper = new timestamp_helper_1.TimestampHelper();
        this.setDescription(`${name} | **${itemScore.displayName}** (${itemScore.score})`);
        this.setFooter(`Looted ${this._timestampHelper.monthDayYearFormatted}`);
    }
}
exports.LootLogEmbed = LootLogEmbed;
