import { RichEmbed, GuildMember } from "discord.js";
import { EmbedHelper } from '../Helpers/embed.helper';
import { MemberScore } from "../Models/loot-score.model";

export class DetailedVisualizationEmbed extends RichEmbed {
    private _embedHelper: EmbedHelper = new EmbedHelper();
    private _highestLootScore: number;
    constructor(lootScoreMap: Map<GuildMember, MemberScore>, memberEntry: [GuildMember, MemberScore]) {
        super();

        this._highestLootScore = this.findHighestLootScore(lootScoreMap);

        this.addMember(memberEntry);
    }

    private addMember(member: [GuildMember, MemberScore]): void {
        let role = 'Role not found';
        if (member[0].highestRole) {
            role = member[0].highestRole.name;
        }

        let name = 'Member not found';
        if (member[0].displayName) {
            name = member[0].displayName;
        }

        this.setColor('#60b5bc');
        this.addField(name, role, true);
        this.addField(`${member[1].attendancePercentage}%`, this._embedHelper.getBar(member[1].attendancePercentage), true);
        this.addField(`${member[1].lootScore}`, this._embedHelper.getBar(this.lootScorePercentage(member[1].lootScore)), true);
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