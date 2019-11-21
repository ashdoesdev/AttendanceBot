import { RichEmbed } from "discord.js";

export class HeadingEmbed extends RichEmbed {
    constructor(field1: string, field2: string) {
        super();
        this.setColor('#60b5bc');
        this.addField(field1, '-------------------------', true);
        this.addField(field2, '-------------------------', true);
    }
}