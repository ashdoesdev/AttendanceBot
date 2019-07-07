import { RichEmbed, GuildMember } from "discord.js";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberScore } from "../Models/loot-score.model";
import { ItemScore } from "../Models/item-score.model";

export class ItemsLootedEmbed extends RichEmbed {
    constructor(itemsLooted: ItemScore[]) {
        super();

        let lootString = '';

        if (itemsLooted.length > 0) {
            for (let i = 0; i < itemsLooted.length; i++) {
                if (i === itemsLooted.length - 1) {
                    if (i === 0) {
                        lootString += `**${itemsLooted[i].displayName}** (${itemsLooted[i].score})`;
                    } else {
                        lootString += `and **${itemsLooted[i].displayName}** (${itemsLooted[i].score})`;
                    }
                } else {
                    lootString += `**${itemsLooted[i].displayName}** (${itemsLooted[i].score}), `;
                }
            }
        }

        this.addField('Items Looted', lootString);
    }
}