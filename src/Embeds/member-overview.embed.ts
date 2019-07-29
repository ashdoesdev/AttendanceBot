import { RichEmbed, GuildMember } from "discord.js";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberScore } from "../Models/loot-score.model";
import { ItemScore } from "../Models/item-score.model";

export class MemberOverviewEmbed extends RichEmbed {
    private _embedHelper: EmbedHelper = new EmbedHelper();
    private _highestLootScore: number;
    constructor(lootScoreMap: Map<GuildMember, MemberScore>, memberEntry: [GuildMember, MemberScore]) {
        super();

        this._highestLootScore = this.findHighestLootScore(lootScoreMap);

        this.addMember(memberEntry);
    }

    private addMember(member: [GuildMember, MemberScore]): void {
        this.setColor('#60b5bc');
        this.addField(`${member[1].lootScore}`, this._embedHelper.getBar(this.lootScorePercentage(member[1].lootScore)), true);
        this.addField(`${member[1].attendancePercentage || 0}%`, this._embedHelper.getBar(member[1].attendancePercentage || 0), true);
        this.addField(`${member[1].seniorityPercentage || 0}%`, this._embedHelper.getBar(member[1].seniorityPercentage || 0), true);
    }

    private findHighestLootScore(lootScoreMap: Map<GuildMember, MemberScore>): number {
        let highest = 0;

        for (let entry of lootScoreMap) {
            if (entry[1].lootScore > highest) {
                highest = entry[1].lootScore;
            }
        }

        return highest;
    }

    private lootScorePercentage(lootScore: number): number {
        return Math.ceil((lootScore / this._highestLootScore) * 100);
    }
}