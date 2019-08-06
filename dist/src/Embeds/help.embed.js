"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class HelpEmbed extends discord_js_1.RichEmbed {
    constructor(appSettings) {
        super();
        this.setColor('#60b5bc');
        this.addField('Feed Commands', `<#${appSettings['feedChannel']}>`);
        this.addBlankField();
        this.addField('Start attendance', '```\n/start```');
        this.addField('End attendance', '```\n/end```');
        this.addField('End attendance without logging (in case of accidental start)', '```\n/end --nolog```');
        this.addField('End attendance without counting seniority', '```\n/end --noseniority```');
        this.addField('Award item', '```\n/give @name shorthand (or full item name)```');
        this.addBlankField();
        this.addField('Admin Commands', `<#${appSettings['adminChannel']}>`);
        this.addBlankField();
        this.addField('Show who needs item', '```\n/needs shorthand (or full item name)```');
        this.addField('Show who has item', '```\n/has shorthand (or full item name)```');
        this.addField('Show LootScore ordered by LootScore', '```\n/show (add --asc to reverse)```');
        this.addField('Show LootScore ordered by name', '```\n/show name (add --asc to reverse)```');
        this.addField('Show LootScore ordered by attendance', '```\n/show attendance (add --asc to reverse)```');
        this.addField('Show LootScore ordered by seniority', '```\n/show seniority (add --asc to reverse)```');
        this.addField('Show full overview for member', '```\n/overview "name"```');
    }
}
exports.HelpEmbed = HelpEmbed;
