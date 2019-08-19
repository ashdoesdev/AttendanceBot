import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";
import { MemberScore } from "../Models/loot-score.model";

export class MinimalVisualizationEmbed extends RichEmbed {
    private _timestampHelper: TimestampHelper = new TimestampHelper();

    constructor(private lootScoreMap: Map<GuildMember, MemberScore>, title: string) {
        super();

        let memberLines: string = '';
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
        this.setTitle(title);
        this.setDescription(this.codeBlockify(topSeparator + header + memberLines + bottomSeparator));
    }

    private codeBlockify(string: string): string {
        return '```' + string + '```';
    }
}

