"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class HelpEmbed extends discord_js_1.RichEmbed {
    constructor(appSettings) {
        super();
        this.setColor('#60b5bc');
        this.addField('Input Channel Commands', `<#${appSettings['feedChannel']}>`);
        this.addBlankField();
        this.addField('Start attendance', '```\n/start```');
        this.addField('End attendance', '```\n/end```');
        this.addField('End attendance without logging (in case of accidental start)', '```\n/end --nolog```');
        this.addField('End attendance without counting seniority', '```\n/end --noseniority```');
        this.addField('Award item', '```\n/give @name shorthand (or full item name)```');
        this.addBlankField();
        this.addField('Admin Channel Commands', `<#${appSettings['adminChannel']}>`);
        this.addBlankField();
        this.addField('Report who needs item', '```\n/report needs shorthand (or full item name)```');
        this.addField('Report who has item', '```\n/report has shorthand (or full item name)```');
        this.addField('Report ordered by LootScore', '```\n/report (add --asc to reverse)```');
        this.addField('Report ordered by name', '```\n/report name (add --asc to reverse)```');
        this.addField('Report ordered by attendance', '```\n/report attendance (add --asc to reverse)```');
        this.addField('Report ordered by seniority', '```\n/report seniority (add --asc to reverse)```');
        this.addField('Report for single member', '```\n/report "name"```');
    }
}
exports.HelpEmbed = HelpEmbed;
