"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class ItemsLootedEmbed extends discord_js_1.RichEmbed {
    constructor(itemsLooted) {
        super();
        let lootString = '';
        if (itemsLooted.length > 0) {
            for (let i = 0; i < itemsLooted.length; i++) {
                if (i === itemsLooted.length - 1) {
                    if (i === 0) {
                        lootString += `**${itemsLooted[i].displayName}** (${itemsLooted[i].score})`;
                    }
                    else {
                        lootString += `and **${itemsLooted[i].displayName}** (${itemsLooted[i].score})`;
                    }
                }
                else {
                    lootString += `**${itemsLooted[i].displayName}** (${itemsLooted[i].score}), `;
                }
            }
        }
        this.addField('Items Looted', lootString);
    }
}
exports.ItemsLootedEmbed = ItemsLootedEmbed;
