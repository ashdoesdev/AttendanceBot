"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class ItemsLootedEmbed extends discord_js_1.RichEmbed {
    constructor(itemsLooted, offspec = false, continued = false) {
        super();
        let lootString = '';
        if (itemsLooted) {
            let mainT1 = itemsLooted.filter((item => item.value.item.shorthand === 't1'));
            let mainT2 = itemsLooted.filter((item => item.value.item.shorthand === 't2'));
            let mainNonTierLooted = itemsLooted.filter((item) => item.value.item.shorthand !== 't1' && item.value.item.shorthand !== 't2');
            let mainItemsArray = new Array();
            if (mainT1.length > 0) {
                mainItemsArray.push(`T1 Set (${mainT1.length})`);
            }
            if (mainT2.length > 0) {
                mainItemsArray.push(`T2 Set (${mainT2.length})`);
            }
            mainNonTierLooted.forEach((item) => {
                mainItemsArray.push(item.value.item.displayName);
            });
            if (mainItemsArray.length > 0) {
                for (let i = 0; i < mainItemsArray.length; i++) {
                    if (i === mainItemsArray.length - 1) {
                        if (i === 0) {
                            lootString += `**${mainItemsArray[i]}**`;
                        }
                        else {
                            lootString += `, **${mainItemsArray[i]}**`;
                        }
                    }
                    else if (i === mainItemsArray.length - 2) {
                        lootString += `**${mainItemsArray[i]}** `;
                    }
                    else {
                        lootString += `**${mainItemsArray[i]}**, `;
                    }
                }
            }
            else {
                lootString = 'None.';
            }
        }
        else {
            lootString = 'None.';
        }
        this.setColor('#60b5bc');
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
exports.ItemsLootedEmbed = ItemsLootedEmbed;
