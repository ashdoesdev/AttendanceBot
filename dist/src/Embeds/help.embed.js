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
        this.addField('Award item', '```\n/give @name shorthandorfullitemname```');
        this.addBlankField();
        this.addField('Admin Channel Commands', `<#${appSettings['adminChannel']}>`);
        this.addBlankField();
        this.addField('Report who is eligible for item', '```\n/report eligible shorthandorfullitemname```');
        this.addField('Report who has item', '```\n/report has shorthandorfullitemname```');
        this.addField('Report full roster', '```\n/report all```');
        this.addField('Report specific class', '```\n/report class "classnameinquotes"```');
        this.addField('Report specific person', '```\n/report "nameinquotes"```');
        this.addBlankField();
        this.addField('Additional modifiers for reports', `Add to any of the report commands above to modify`);
        this.addBlankField();
        this.addField('Order by LootScore', '```\nDefault. No modifier needed```');
        this.addField('Order by name', '```\n--name```');
        this.addField('Order by attendance', '```\n--attendance```');
        this.addField('Order by seniority', '```\n--seniority```');
        this.addField('Report in descending order', '```\nDefault. No modifier needed```');
        this.addField('Report in ascending order', '```\n--asc```');
    }
}
exports.HelpEmbed = HelpEmbed;
