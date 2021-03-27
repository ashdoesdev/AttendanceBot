"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const embed_helper_1 = require("../Helpers/embed.helper");
class PublicAttendanceEmbed extends discord_js_1.RichEmbed {
    constructor(memberEntry, appSettings) {
        super();
        this._embedHelper = new embed_helper_1.EmbedHelper();
        this.setColor(appSettings['guildColor']);
        this._appSettings = appSettings;
        this.addMember(memberEntry);
    }
    addMember(member) {
        this.setAuthor(member[0].displayName, member[0].user.avatarURL);
        let visibleRoles = Array.from(this._appSettings['visibleRoles']);
        let memberRoles;
        for (let role of visibleRoles) {
            if (member[0].roles.array().filter((x) => x.id === role[1])) {
                memberRoles += role[1] + " ";
            }
        }
        this.setDescription(memberRoles);
        this.addField(`**${member[1].attendancePercentage || 0}%** attendance`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`**${member[1].seniorityPercentage || 0}%** seniority`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }
}
exports.PublicAttendanceEmbed = PublicAttendanceEmbed;
