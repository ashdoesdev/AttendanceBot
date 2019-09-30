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
        this.addField('Award item', '```\n/g (or /give) @name itemname```');
        this.addField('Award offspec item', '```\n/g (or /give) @name itemname --offspec```');
        this.addBlankField();
        this.addField('Admin Channel Commands', `<#${appSettings['adminChannel']}>`);
        this.addBlankField();
        this.addField('Award existing item (for recruits that come geared - no value)', '```\n/g (or /give) "nameinquotes" itemname --existing```');
        this.addField('Report who is eligible for item', '```\n/report eligible "itemname"```');
        this.addField('Report who has item', '```\n/report has "itemname"```');
        this.addField('Report specific person', '```\n/report "nameinquotes"```');
        this.addField('Report full roster', '```\n/report```');
        this.addBlankField();
        this.addField('Report Modifiers', `Add to any of the report commands above to modify`);
        this.addBlankField();
        this.addField('Filter by certain class (or classes)', '```\n--classname```');
        this.addField('Order by ItemScore', '```\nDefault. No modifier needed```');
        this.addField('Order by offspec ItemScore', '```\n--offspec```');
        this.addField('Order by last loot date', '```\n--lastloot```');
        this.addField('Order by name', '```\n--name```');
        this.addField('Order by attendance', '```\n--attendance```');
        this.addField('Order by seniority', '```\n--seniority```');
    }
}
exports.HelpEmbed = HelpEmbed;
