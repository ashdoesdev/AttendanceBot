"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class ItemsLootedExpandedEmbed extends discord_js_1.RichEmbed {
    constructor(itemsLooted, offspec = false, continued = false) {
        super();
        let lootString = '';
        if (itemsLooted) {
            let mainT1 = itemsLooted.filter((item => item.value.item.shorthand === 't1'));
            let mainT2 = itemsLooted.filter((item => item.value.item.shorthand === 't2'));
            let mainNonTierLooted = itemsLooted.filter((item) => item.value.item.shorthand !== 't1' && item.value.item.shorthand !== 't2');
            let mainItemsArray = new Array();
            if (mainT1.length > 0) {
                mainItemsArray.push(`T1 Set x${mainT1.length} (${mainT1[0].value.item.score * mainT1.length})`);
            }
            if (mainT2.length > 0) {
                mainItemsArray.push(`T2 Set x${mainT2.length} (${mainT2[0].value.item.score * mainT2.length})`);
            }
            mainNonTierLooted.sort((a, b) => b.value.item.score - a.value.item.score);
            mainNonTierLooted.forEach((item) => {
                if (item.value.item.score === 15) {
                    mainItemsArray.push(`**${item.value.item.displayName}** (${item.value.item.score})`);
                }
                else {
                    mainItemsArray.push(`${item.value.item.displayName} (${item.value.item.score})`);
                }
            });
            if (mainItemsArray.length > 0) {
                for (let i = 0; i < mainItemsArray.length; i++) {
                    if (i === mainItemsArray.length - 1) {
                        if (i === 0) {
                            lootString += `${mainItemsArray[i]}`;
                        }
                        else {
                            lootString += `and ${mainItemsArray[i]}`;
                        }
                    }
                    else if (i === mainItemsArray.length - 2) {
                        lootString += `${mainItemsArray[i]} `;
                    }
                    else {
                        lootString += `${mainItemsArray[i]}, `;
                    }
                }
            }
            else {
                lootString = 'No items looted.';
            }
        }
        else {
            lootString = 'No items looted.';
        }
        let offspecMessage = 'Offspec Items Looted';
        let message = 'Items Looted';
        if (continued) {
            offspecMessage += ' (continued)';
            message += ' (continued)';
        }
        if (offspec) {
            this.addField(offspecMessage, lootString);
        }
        else {
            this.addField(message, lootString);
        }
    }
}
exports.ItemsLootedExpandedEmbed = ItemsLootedExpandedEmbed;
