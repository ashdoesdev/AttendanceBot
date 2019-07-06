import { RichEmbed } from "discord.js";

export class HelpEmbed extends RichEmbed {
    constructor() {
        super();

        this.setColor('#f4c65a');
        this.setTitle('LootScore Commands');
        this.setDescription('Something something description here if desired.');
        this.addBlankField();
        this.addField('Start attendance', '```\nls s```');
        this.addField('End attendance', '```\nls e```');
        this.addField('End attendance without logging', '```\nls e --nolog```');
        this.addBlankField();
        this.addField('Award item', '```\nls g @name shorthand```');
        this.addBlankField();
        this.addField('Show LootScore ordered by name', '```\nls --name```');
        this.addField('Show LootScore ordered by attendance', '```\nls --attendance```');
        this.addField('Show LootScore ordered by seniority', '```\nls --seniority```');
        this.addField('Show LootScore ordered by LootScore', '```\nls --ls```');
        this.addBlankField();
        this.addField('Load item scores from csv', '```\nls getitemscores C:/path/to/file.csv```');
    }
}