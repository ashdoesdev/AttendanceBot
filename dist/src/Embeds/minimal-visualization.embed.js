"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const loot_score_service_1 = require("../Services/loot-score.service");
class MinimalVisualizationEmbed extends discord_js_1.RichEmbed {
    constructor(lootScoreMap, title, first, last, item) {
        super();
        this.lootScoreMap = lootScoreMap;
        this._lootScoreService = new loot_score_service_1.LootScoreService();
        let memberLines = '';
        let topSeparator = '╔══════════════╦══════╦══════╦══════╦══════╦═══════════╗\n';
        let separator = '╠══════════════╬══════╬══════╬══════╬══════╬═══════════╣\n';
        let bottomSeparator = '╚══════════════╩══════╩══════╩══════╩══════╩═══════════╝\n';
        let header;
        if (item) {
            header = '║ Name         ║ Att. ║ Sen. ║ Main ║ O/S  ║ Loot Date ║\n';
        }
        else {
            header = '║ Name         ║ Att. ║ Sen. ║ Main ║ O/S  ║ Last Main ║\n';
        }
        for (let member of lootScoreMap) {
            memberLines += separator;
            let name = member[0].displayName.slice(0, 12).padEnd(12, ' ');
            let attendance = "---".padEnd(4, ' ');
            let seniority = "---".padEnd(4, ' ');
            if (member[1].attendancePercentage > 0) {
                attendance = `${member[1].attendancePercentage}%`.padEnd(4, ' ');
            }
            if (member[1].seniorityPercentage > 0) {
                seniority = `${member[1].seniorityPercentage}%`.padEnd(4, ' ');
            }
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
