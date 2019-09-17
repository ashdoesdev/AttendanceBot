import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";
import { MemberScore } from "../Models/loot-score.model";

export class MinimalVisualizationEmbed extends RichEmbed {
    constructor(private lootScoreMap: Map<GuildMember, MemberScore>, title: string, first?: boolean, last?: boolean) {
        super();

        let memberLines: string = '';
        let topSeparator = '╔══════════════╦══════╦══════╦══════╦══════╦═══════════╗\n';
        let separator = '╠══════════════╬══════╬══════╬══════╬══════╬═══════════╣\n';
        let bottomSeparator = '╚══════════════╩══════╩══════╩══════╩══════╩═══════════╝\n';
        let header = '║ Name         ║ Att. ║ Sen. ║ Main ║ O/S  ║ Last Loot ║\n';

        for (let member of lootScoreMap) {
            memberLines += separator;

            let name = member[0].displayName.slice(0, 12).padEnd(12, ' ');
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
        } else if (first) {
            this.setTitle(title);
            this.setDescription(this.codeBlockify(topSeparator + header + memberLines));
        } else if (last) {
            this.setDescription(this.codeBlockify(memberLines + bottomSeparator));
        } else {
            this.setDescription(this.codeBlockify(memberLines));
        }

    }

    private codeBlockify(string: string): string {
        return '```' + string + '```';
    }
}

