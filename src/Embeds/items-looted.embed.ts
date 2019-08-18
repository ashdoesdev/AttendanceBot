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
                            lootString += `**${itemsLooted[i].displayName}**`;
                        } else {
                            lootString += `and **${itemsLooted[i].displayName}**`;
                        }
                    } else if (i === itemsLooted.length - 2) {
                        lootString += `**${itemsLooted[i].displayName}** `;
                    } else {
                        lootString += `**${itemsLooted[i].displayName}**, `;
                    }
                }
            }
        } else {
            lootString = 'No items looted.';
        }

        this.setColor('#60b5bc');
        this.addField('Items Looted', lootString);
    }
}