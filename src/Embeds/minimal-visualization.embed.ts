import { GuildMember, RichEmbed } from "discord.js";
import { ItemScore, AwardedItem } from "../Models/item-score.model";
import { MemberScore, MinimalMember, LootScoreData } from "../Models/loot-score.model";
import { LootScoreService } from "../Services/loot-score.service";

export class MinimalVisualizationEmbed extends RichEmbed {
    private _lootScoreService: LootScoreService = new LootScoreService();

    constructor(private lootLogMap: Map<GuildMember | MinimalMember, LootScoreData<AwardedItem>[]>, private lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>, title: string, first?: boolean, last?: boolean, item?: ItemScore) {
        super();

        let memberLines: string = '';
        let topSeparator = '╔══════════════╦══════╦══════╦══════╦══════╦═══════════╗\n';
        let separator = '╠══════════════╬══════╬══════╬══════╬══════╬═══════════╣\n';
        let bottomSeparator = '╚══════════════╩══════╩══════╩══════╩══════╩═══════════╝\n';
        let header;

        if (item) {
            header = '║ Name         ║ Att. ║ Sen. ║ Main ║ O/S  ║ Loot Date ║\n';
        } else {
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
            let lastLootDate;

            if (item) {
                lastLootDate = this._lootScoreService.getLastLootDateForItem(lootLogMap, item, member[0]).padEnd(9, ' ');
            } else {
                lastLootDate = member[1].lastLootDate.padEnd(9, ' ');
            }

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

