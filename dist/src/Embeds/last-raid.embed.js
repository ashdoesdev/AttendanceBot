"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class LastRaidEmbed extends discord_js_1.RichEmbed {
    constructor(itemsLooted, attendance) {
        super();
        this.itemsLooted = itemsLooted;
        this.attendance = attendance;
        let raidDate = new Date(attendance.signature.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });
        let itemLines = '';
        let itemTop = '╔════════════════════════════════════╦════════════════════╗\n';
        let itemSeparator = '╠════════════════════════════════════╬════════════════════╣\n';
        let itemBottom = '╚════════════════════════════════════╩════════════════════╝\n';
        let itemHeader = '║ Item Name                          ║ Awarded To         ║\n';
        for (let item of itemsLooted) {
            itemLines += itemSeparator;
            let itemName = item.value.item.displayName.slice(0, 34).padEnd(34, ' ');
            let awardedTo = item.value.member.displayName.slice(0, 18).padEnd(18, ' ');
            itemLines += `║ ${itemName} ║ ${awardedTo} ║\n`;
        }
        let attendanceLines = '';
        for (let entry of attendance.value) {
            attendanceLines += `**${entry[0]}**: ${entry[1]}%\n`;
        }
        this.setColor('#60b5bc');
        this.setTitle(`Overview of Last Raid (**${raidDate}**)`);
        this.addField('Items Looted', this.codeBlockify(itemTop + itemHeader + itemLines + itemBottom));
        this.addField('Attendance', attendanceLines);
    }
    codeBlockify(string) {
        return '```' + string + '```';
    }
}
exports.LastRaidEmbed = LastRaidEmbed;
