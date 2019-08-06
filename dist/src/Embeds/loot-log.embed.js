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
        this.setColor('#60b5bc');
        this.addField(name, `**${itemScore.displayName}**`);
        this.setFooter(`Awarded by ${requester} on ${this._timestampHelper.monthDayYearFormatted}`);
    }
}
exports.LootLogEmbed = LootLogEmbed;
