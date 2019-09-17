"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class ItemsLootedExpandedEmbed extends discord_js_1.RichEmbed {
    constructor(itemsLooted) {
        super();
        let lootString = '';
        let offspecLootString = '';
        let otherLootString = '';
        if (itemsLooted) {
            let mainItemsLooted = itemsLooted.filter((item) => !item.value.offspec && (!item.value.flags.includes('existing') && !item.value.flags.includes('rot') && !item.value.flags.includes('roll')));
            let mainT1 = mainItemsLooted.filter((item => item.value.item.shorthand === 't1'));
            let mainT2 = mainItemsLooted.filter((item => item.value.item.shorthand === 't2'));
            let mainNonTierLooted = mainItemsLooted.filter((item) => item.value.item.shorthand !== 't1' && item.value.item.shorthand !== 't2');
            let mainItemsArray = new Array();
            if (mainT1.length > 0) {
                mainItemsArray.push(`T1 Set x${mainT1.length} (${mainT1[0].value.item.score * mainT1.length})`);
            }
            if (mainT2.length > 0) {
                mainItemsArray.push(`T2 Set x${mainT2.length} (${mainT2[0].value.item.score * mainT2.length})`);
            }
            mainNonTierLooted.sort((a, b) => b.value.item.score - a.value.item.score);
            mainNonTierLooted.forEach((item) => {
                if (item.value.item.score === 8) {
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
            let offspecItemsLooted = itemsLooted.filter((item) => item.value.offspec === true && (!item.value.flags.includes('existing') && !item.value.flags.includes('rot') && !item.value.flags.includes('roll')));
            let offspecT1 = offspecItemsLooted.filter((item => item.value.item.shorthand === 't1'));
            let offspecT2 = offspecItemsLooted.filter((item => item.value.item.shorthand === 't2'));
            let offspecNonTierLooted = offspecItemsLooted.filter((item) => item.value.item.shorthand !== 't1' && item.value.item.shorthand !== 't2');
            let offspecItemsArray = new Array();
            if (offspecT1.length > 0) {
                offspecItemsArray.push(`T1 Set x${offspecT1.length} (${offspecT1[0].value.item.score * offspecT1.length})`);
            }
            if (offspecT2.length > 0) {
                offspecItemsArray.push(`T2 Set x${offspecT2.length} (${offspecT2[0].value.item.score * offspecT2.length})`);
            }
            offspecNonTierLooted.sort((a, b) => b.value.item.score - a.value.item.score);
            offspecNonTierLooted.forEach((item) => {
                if (item.value.item.score === 8) {
                    offspecItemsArray.push(`**${item.value.item.displayName}** (${item.value.item.score})`);
                }
                else {
                    offspecItemsArray.push(`${item.value.item.displayName} (${item.value.item.score})`);
                }
            });
            if (offspecItemsArray.length > 0) {
                for (let i = 0; i < offspecItemsArray.length; i++) {
                    if (i === offspecItemsArray.length - 1) {
                        if (i === 0) {
                            offspecLootString += `${offspecItemsArray[i]}`;
                        }
                        else {
                            offspecLootString += `and ${offspecItemsArray[i]}`;
                        }
                    }
                    else if (i === offspecItemsArray.length - 2) {
                        offspecLootString += `${offspecItemsArray[i]}  `;
                    }
                    else {
                        offspecLootString += `${offspecItemsArray[i]}, `;
                    }
                }
            }
            else {
                offspecLootString = 'No offspec items looted.';
            }
            let otherItemsLooted = itemsLooted.filter((item) => item.value.flags.includes('existing') || item.value.flags.includes('rot') || item.value.flags.includes('roll'));
            let otherItemsT1 = otherItemsLooted.filter((item => item.value.item.shorthand === 't1'));
            let otherItemsT2 = otherItemsLooted.filter((item => item.value.item.shorthand === 't2'));
            let otherItemsNonTierLooted = otherItemsLooted.filter((item) => item.value.item.shorthand !== 't1' && item.value.item.shorthand !== 't2');
            let otherItemsArray = new Array();
            if (otherItemsT1.length > 0) {
                otherItemsArray.push(`T1 Set x${otherItemsT1.length}`);
            }
            if (otherItemsT2.length > 0) {
                otherItemsArray.push(`T2 Set x${otherItemsT2.length}`);
            }
            otherItemsNonTierLooted.sort((a, b) => b.value.item.score - a.value.item.score);
            otherItemsNonTierLooted.forEach((item) => {
                if (item.value.item.score === 8) {
                    otherItemsArray.push(`**${item.value.item.displayName}**`);
                }
                else {
                    otherItemsArray.push(`${item.value.item.displayName}`);
                }
            });
            if (otherItemsArray.length > 0) {
                for (let i = 0; i < otherItemsArray.length; i++) {
                    if (i === otherItemsArray.length - 1) {
                        if (i === 0) {
                            otherLootString += `${otherItemsArray[i]}`;
                        }
                        else {
                            otherLootString += `and ${otherItemsArray[i]}`;
                        }
                    }
                    else if (i === otherItemsArray.length - 2) {
                        otherLootString += `${otherItemsArray[i]}  `;
                    }
                    else {
                        otherLootString += `${otherItemsArray[i]}, `;
                    }
                }
            }
            else {
                otherLootString = 'No other items looted.';
            }
        }
        else {
            lootString = 'No items looted.';
            offspecLootString = 'No offspec items looted.';
            otherLootString = 'No other items looted.';
        }
        this.setColor('#60b5bc');
        this.addField('Items Looted', lootString);
        this.addField('Offspec Items Looted', offspecLootString);
        this.addField('Other Items (no value - rolled, existing, etc.)', otherLootString);
    }
}
exports.ItemsLootedExpandedEmbed = ItemsLootedExpandedEmbed;
