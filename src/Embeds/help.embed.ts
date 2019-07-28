import { RichEmbed } from "discord.js";

export class HelpEmbed extends RichEmbed {
    constructor() {
        super();

        this.setColor('#f4c65a');
        this.setTitle('LootScore Commands');
        this.setDescription('All commands must be made in the <#603778824487960685> channel');
        this.addBlankField();
        this.addField('Start attendance', '```\n/start```');
        this.addField('End attendance', '```\n/end```');
        this.addField('End attendance without logging', '```\n/end --nolog```');
        this.addBlankField();
        this.addField('Award item', '```\n/give @name shorthand```');
        this.addField('Show who needs item in current raid', '```\n/needs shorthand```');
        this.addField('Show who needs item in guild (not limited to those present in raid)', '```\n/needs --all shorthand```');
        this.addField('Show who has item in current raid', '```\n/has shorthand```');
        this.addField('Show who has item in guild (not limited to those present in raid)', '```\n/has --all shorthand```');
        this.addBlankField();
        this.addField('Show LootScore ordered by LootScore', '```\n/ls```');
        this.addField('Show LootScore ordered by name', '```\n/ls --name```');
        this.addField('Show LootScore ordered by attendance', '```\n/ls --attendance```');
        this.addField('Show LootScore ordered by seniority', '```\n/ls --seniority```');
        this.addBlankField();
        this.addField('Show full overview for member', '```\n/overview @name```');
    }
}