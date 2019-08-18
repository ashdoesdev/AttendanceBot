import { RichEmbed } from "discord.js";
import { ItemScore, AwardedItem } from "../Models/item-score.model";
import { LootScoreData } from "../Models/loot-score.model";

export class ItemsLootedEmbed extends RichEmbed {
    constructor(itemsLooted: LootScoreData<AwardedItem>[]) {
        super();

        let lootString = '';
        let offspecLootString = '';

        let mainItemsLooted = itemsLooted.filter((item) => !item.value.offspec);
        let offspecItemsLooted = itemsLooted.filter((item) => item.value.offspec === true);

        if (mainItemsLooted) {
            if (mainItemsLooted.length > 0) {
                for (let i = 0; i < mainItemsLooted.length; i++) {
                    if (i === mainItemsLooted.length - 1) {
                        if (i === 0) {
                            lootString += `**${mainItemsLooted[i].value.item.displayName}**`;
                        } else {
                            lootString += `and **${mainItemsLooted[i].value.item.displayName}**`;
                        }
                    } else if (i === mainItemsLooted.length - 2) {
                        lootString += `**${mainItemsLooted[i].value.item.displayName}** `;
                    } else {
                        lootString += `**${mainItemsLooted[i].value.item.displayName}**, `;
                    }
                }
            }
        } else {
            lootString = 'No items looted.';
        }
        
        if (offspecItemsLooted) {
            if (offspecItemsLooted.length > 0) {
                for (let i = 0; i < offspecItemsLooted.length; i++) {
                    if (i === offspecItemsLooted.length - 1) {
                        if (i === 0) {
                            offspecLootString += `**${offspecItemsLooted[i].value.item.displayName}**`;
                        } else {
                            offspecLootString += `and **${offspecItemsLooted[i].value.item.displayName}**`;
                        }
                    } else if (i === offspecItemsLooted.length - 2) {
                        offspecLootString += `**${offspecItemsLooted[i].value.item.displayName}** `;
                    } else {
                        offspecLootString += `**${offspecItemsLooted[i].value.item.displayName}**, `;
                    }
                }
            }
        } else {
            lootString = 'No items looted.';
        }

        this.setColor('#60b5bc');
        this.addField('Items Looted', lootString);
        this.addField('Offspec Items Looted', offspecLootString);
    }
}