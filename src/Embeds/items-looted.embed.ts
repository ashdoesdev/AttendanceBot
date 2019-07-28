import { RichEmbed } from "discord.js";
import { ItemScore } from "../Models/item-score.model";

export class ItemsLootedEmbed extends RichEmbed {
    constructor(itemsLooted: ItemScore[]) {
        super();

        let lootString = '';

        if (itemsLooted) {
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
        } else {
            lootString = 'No items looted.';
        }

        this.addField('Items Looted', lootString);
    }
}