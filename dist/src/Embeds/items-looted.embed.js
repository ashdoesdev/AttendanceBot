"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class ItemsLootedEmbed extends discord_js_1.RichEmbed {
    constructor(itemsLooted) {
        super();
        let lootString = '';
        if (itemsLooted) {
            if (itemsLooted.length > 0) {
                for (let i = 0; i < itemsLooted.length; i++) {
                    if (i === itemsLooted.length - 1) {
                        if (i === 0) {
                            lootString += `**${itemsLooted[i].displayName}**`;
                        }
                        else {
                            lootString += `and **${itemsLooted[i].displayName}**`;
                        }
                    }
                    else if (i === itemsLooted.length - 2) {
                        lootString += `**${itemsLooted[i].displayName}** `;
                    }
                    else {
                        lootString += `**${itemsLooted[i].displayName}**, `;
                    }
                }
            }
        }
        else {
            lootString = 'No items looted.';
        }
        this.setColor('#60b5bc');
        this.addField('Items Looted', lootString);
    }
}
exports.ItemsLootedEmbed = ItemsLootedEmbed;
