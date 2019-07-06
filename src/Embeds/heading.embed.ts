import { RichEmbed, GuildMember } from "discord.js";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberScore } from "../Models/loot-score.model";

export class HeadingEmbed extends RichEmbed {
    constructor(field1: string, field2: string, field3: string) {
        super();

        this.addField(field1, '------------------------------', true);
        this.addField(field2, '------------------------------', true);
        this.addField(field3, '------------------------------', true);
    }
}