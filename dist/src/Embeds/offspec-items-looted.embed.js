"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class OffspecItemsLootedEmbed extends discord_js_1.RichEmbed {
    constructor(itemsLooted) {
        super();
        let offspecLootString = '';
        if (itemsLooted) {
            let offspecItemsLooted = itemsLooted.filter((item) => item.value.offspec === true);
            let offspecT1 = offspecItemsLooted.filter((item => item.value.item.shorthand === 't1'));
            let offspecT2 = offspecItemsLooted.filter((item => item.value.item.shorthand === 't2'));
            let offspecNonTierLooted = offspecItemsLooted.filter((item) => item.value.item.shorthand !== 't1' && item.value.item.shorthand !== 't2');
            let offspecItemsArray = new Array();
            if (offspecT1.length > 0) {
                offspecItemsArray.push(`T1 Set (${offspecT1.length})`);
            }
            if (offspecT2.length > 0) {
                offspecItemsArray.push(`T2 Set (${offspecT2.length})`);
            }
            offspecNonTierLooted.forEach((item) => {
                offspecItemsArray.push(item.value.item.displayName);
            });
            if (offspecItemsArray.length > 0) {
                for (let i = 0; i < offspecItemsArray.length; i++) {
                    if (i === offspecItemsArray.length - 1) {
                        if (i === 0) {
                            offspecLootString += `**${offspecItemsArray[i]}**`;
                        }
                        else {
                            offspecLootString += `and **${offspecItemsArray[i]}**`;
                        }
                    }
                    else if (i === offspecItemsArray.length - 2) {
                        offspecLootString += `**${offspecItemsArray[i]}** `;
                    }
                    else {
                        offspecLootString += `**${offspecItemsArray[i]}**, `;
                    }
                }
            }
            else {
                offspecLootString = 'No offspec items looted.';
            }
        }
        else {
            offspecLootString = 'No offspec items looted.';
        }
        this.setColor('#60b5bc');
        this.addField('Offspec Items Looted', offspecLootString);
    }
}
exports.OffspecItemsLootedEmbed = OffspecItemsLootedEmbed;
