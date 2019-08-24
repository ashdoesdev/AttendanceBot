"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
class MinimalVisualizationEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap, title, first, last) {
        super();
        this.lootScoreMap = lootScoreMap;
        let memberLines = '';
        let topSeparator = '╔═════════════════╦══════╦══════╦══════╦══════╦═══════════╗\n';
        let separator = '╠═════════════════╬══════╬══════╬══════╬══════╬═══════════╣\n';
        let bottomSeparator = '╚═════════════════╩══════╩══════╩══════╩══════╩═══════════╝\n';
        let header = '║ Name            ║ Att. ║ Sen. ║ Main ║ O/S  ║ Last Loot ║\n';
        for (let member of lootScoreMap) {
            memberLines += separator;
            let name = member[0].displayName.slice(0, 15).padEnd(15, ' ');
            let attendance = `${member[1].attendancePercentage}%`.padEnd(4, ' ');
            let seniority = `${member[1].seniorityPercentage}%`.padEnd(4, ' ');
            let main = member[1].itemScoreTotal.toString().slice(0, 4).padEnd(4, ' ');
            let offspec = member[1].itemScoreOffspecTotal.toString().slice(0, 4).padEnd(4, ' ');
            let lastLootDate = member[1].lastLootDate.padEnd(9, ' ');
            memberLines += `║ ${name} ║ ${attendance} ║ ${seniority} ║ ${main} ║ ${offspec} ║ ${lastLootDate} ║\n`;
        }
        this.setColor('#60b5bc');
        if (first && last) {
            this.setTitle(title);
            this.setDescription(this.codeBlockify(topSeparator + header + memberLines + bottomSeparator));
        }
        else if (first) {
            this.setTitle(title);
            this.setDescription(this.codeBlockify(topSeparator + header + memberLines));
        }
        else if (last) {
            this.setDescription(this.codeBlockify(memberLines + bottomSeparator));
        }
        else {
            this.setDescription(this.codeBlockify(memberLines));
        }
    }
    codeBlockify(string) {
        return '```' + string + '```';
    }
}
exports.MinimalVisualizationEmbed = MinimalVisualizationEmbed;
