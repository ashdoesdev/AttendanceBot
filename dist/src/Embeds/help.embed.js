"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class HelpEmbed extends discord_js_1.RichEmbed {
    constructor() {
        super();
        this.setColor('#f4c65a');
        this.setTitle('LootScore Commands');
        this.setDescription('All commands must be made in the <#603778824487960685> channel. Item shorthands are the second value in the <#571794427958525962> channel.');
        this.addBlankField();
        this.addField('Start attendance', '```\n/start```');
        this.addField('End attendance', '```\n/end```');
        this.addField('End attendance without logging (in case of accidental start)', '```\n/end --nolog```');
        this.addBlankField();
        this.addField('Award item', '```\n/give @name shorthand```');
        this.addField('Show who needs item', '```\n/needs shorthand```');
        this.addField('Show who has item', '```\n/has shorthand```');
        this.addBlankField();
        this.addField('Show LootScore ordered by LootScore', '```\n/ls```');
        this.addField('Show LootScore ordered by name', '```\n/ls name```');
        this.addField('Show LootScore ordered by attendance', '```\n/ls attendance```');
        this.addField('Show LootScore ordered by seniority', '```\n/ls seniority```');
        this.addField('Descending order is default', '```\nAdd --asc flag to reverse the results```');
        this.addBlankField();
        this.addField('Show full overview for member', '```\n/overview @name```');
    }
}
exports.HelpEmbed = HelpEmbed;
