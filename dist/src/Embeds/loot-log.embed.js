"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const timestamp_helper_1 = require("../Helpers/timestamp.helper");
class LootLogEmbed extends discord_js_1.RichEmbed {
    constructor(itemScore, name, requester) {
        super();
        this.itemScore = itemScore;
        this.name = name;
        this.requester = requester;
        this._timestampHelper = new timestamp_helper_1.TimestampHelper();
        this.addField(name, `**${itemScore.displayName}** (${itemScore.score})`);
        this.setFooter(`Awarded by ${requester} on ${this._timestampHelper.monthDayYearFormatted}`);
    }
}
exports.LootLogEmbed = LootLogEmbed;
