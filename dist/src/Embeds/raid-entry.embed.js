"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed_helper_1 = require("../Helpers/embed.helper");
class RaidEntryEmbed extends discord_js_1.RichEmbed {
    constructor(attendanceMap) {
        super();
        this.attendanceMap = attendanceMap;
        this._embedHelper = new embed_helper_1.EmbedHelper();
        for (let member of attendanceMap) {
            this.addMember(member);
        }
    }
    addMember(member) {
        this.addField(member[0].displayName, member[0].highestRole.name, true);
        this.addField(`${member[1]}%`, this._embedHelper.getBar(member[1]), true);
        this.addField('Items Looted', 'item 1, item 5', true);
    }
}
exports.RaidEntryEmbed = RaidEntryEmbed;
