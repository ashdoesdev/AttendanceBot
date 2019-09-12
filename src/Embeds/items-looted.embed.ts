import { RichEmbed } from "discord.js";
import { ItemScore, AwardedItem } from "../Models/item-score.model";
import { LootScoreData } from "../Models/loot-score.model";

export class ItemsLootedEmbed extends RichEmbed {
    constructor(itemsLooted: LootScoreData<AwardedItem>[]) {
        super();

        let lootString = '';
        let offspecLootString = '';
        let otherLootString = '';

        if (itemsLooted) {
            let mainItemsLooted = itemsLooted.filter((item) => !item.value.offspec && (!item.value.roll && !item.value.rot));
            let mainT1 = mainItemsLooted.filter((item => item.value.item.shorthand === 't1'));
            let mainT2 = mainItemsLooted.filter((item => item.value.item.shorthand === 't2'));
            let mainNonTierLooted = mainItemsLooted.filter((item) => item.value.item.shorthand !== 't1' && item.value.item.shorthand !== 't2');
            let mainItemsArray = new Array<string>();

            if (mainT1.length > 0) {
                mainItemsArray.push(`T1 Set (${mainT1.length})`)
            }
            
            if (mainT2.length > 0) {
                mainItemsArray.push(`T2 Set (${mainT2.length})`)
            }

            mainNonTierLooted.forEach((item) => {
                mainItemsArray.push(item.value.item.displayName);
            })

            if (mainItemsArray.length > 0) {
                for (let i = 0; i < mainItemsArray.length; i++) {
                    if (i === mainItemsArray.length - 1) {
                        if (i === 0) {
                            lootString += `**${mainItemsArray[i]}**`;
                        } else {
                            lootString += `and **${mainItemsArray[i]}**`;
                        }
                    } else if (i === mainItemsArray.length - 2) {
                        lootString += `**${mainItemsArray[i]}** `;
                    } else {
                        lootString += `**${mainItemsArray[i]}**, `;
                    }
                }
            } else {
                lootString = 'No items looted.';
            }

            let offspecItemsLooted = itemsLooted.filter((item) => item.value.offspec === true && (!item.value.roll && !item.value.rot));
            let offspecT1 = offspecItemsLooted.filter((item => item.value.item.shorthand === 't1'));
            let offspecT2 = offspecItemsLooted.filter((item => item.value.item.shorthand === 't2'));
            let offspecNonTierLooted = offspecItemsLooted.filter((item) => item.value.item.shorthand !== 't1' && item.value.item.shorthand !== 't2');
            let offspecItemsArray = new Array<string>();

            if (offspecT1.length > 0) {
                offspecItemsArray.push(`T1 Set (${offspecT1.length})`)
            }

            if (offspecT2.length > 0) {
                offspecItemsArray.push(`T2 Set (${offspecT2.length})`)
            }

            offspecNonTierLooted.forEach((item) => {
                offspecItemsArray.push(item.value.item.displayName);
            })

            if (offspecItemsArray.length > 0) {
                for (let i = 0; i < offspecItemsArray.length; i++) {
                    if (i === offspecItemsArray.length - 1) {
                        if (i === 0) {
                            offspecLootString += `**${offspecItemsArray[i]}**`;
                        } else {
                            offspecLootString += `and **${offspecItemsArray[i]}**`;
                        }
                    } else if (i === offspecItemsArray.length - 2) {
                        offspecLootString += `**${offspecItemsArray[i]}** `;
                    } else {
                        offspecLootString += `**${offspecItemsArray[i]}**, `;
                    }
                }
            } else {
                offspecLootString = 'No offspec items looted.';
            }

            let otherItemsLooted = itemsLooted.filter((item) => item.value.roll || item.value.rot);
            
            let otherItemsArray = new Array<string>();

            otherItemsLooted.forEach((item) => {
                otherItemsArray.push(item.value.item.displayName);
            })

            if (otherItemsArray.length > 0) {
                for (let i = 0; i < otherItemsArray.length; i++) {
                    if (i === otherItemsArray.length - 1) {
                        if (i === 0) {
                            otherLootString += `**${otherItemsArray[i]}**`;
                        } else {
                            otherLootString += `and **${otherItemsArray[i]}**`;
                        }
                    } else if (i === otherItemsArray.length - 2) {
                        otherLootString += `**${otherItemsArray[i]}** `;
                    } else {
                        otherLootString += `**${otherItemsArray[i]}**, `;
                    }
                }
            } else {
                otherLootString = 'No other items looted.';
            }

        } else {
            lootString = 'No items looted.';
            offspecLootString = 'No offspec items looted.';
            otherLootString = 'No other items looted.';
        }

        this.setColor('#60b5bc');
        this.addField('Items Looted', lootString);
        this.addField('Offspec Items Looted', offspecLootString);
        this.addField('Other Items (rolled, existing, or rot)', otherLootString);
    }
}