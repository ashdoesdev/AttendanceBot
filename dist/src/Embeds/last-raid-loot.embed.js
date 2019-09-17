"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class LastRaidLootEmbed extends discord_js_1.RichEmbed {
    constructor(itemsLooted, first, last) {
        super();
        this.itemsLooted = itemsLooted;
        let raidDate = new Date(itemsLooted[0].signature.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
        let itemLines = '';
        let itemTop = '╔══════════════════════════════════╦═══════════════════╗\n';
        let itemSeparator = '╠══════════════════════════════════╬═══════════════════╣\n';
        let itemBottom = '╚══════════════════════════════════╩═══════════════════╝\n';
        let itemHeader = '║ [ Item Name ]                    ║ [ Awarded To ]    ║\n';
        for (let item of itemsLooted) {
            itemLines += itemSeparator;
            let itemName = item.value.item.displayName.slice(0, 32).padEnd(32, ' ');
            let awardedTo = item.value.member.displayName.slice(0, 17).padEnd(17, ' ');
            itemLines += `║ ${itemName} ║ ${awardedTo} ║\n`;
        }
        this.setColor('#60b5bc');
        if (first && last) {
            this.setTitle(`Items Looted Last Raid (**${raidDate}**)`);
            this.setDescription(this.codeBlockify(itemTop + itemHeader + itemLines + itemBottom));
        }
        else if (first) {
            this.setTitle(`Items Looted Last Raid (**${raidDate}**)`);
            this.setDescription(this.codeBlockify(itemTop + itemHeader + itemLines));
        }
        else if (last) {
            this.setDescription(this.codeBlockify(itemLines + itemBottom));
        }
        else {
            this.setDescription(this.codeBlockify(itemLines));
        }
    }
    codeBlockify(string) {
        return '```ini\n' + string + '```';
    }
}
exports.LastRaidLootEmbed = LastRaidLootEmbed;
