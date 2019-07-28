import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";
import { MemberScore } from "../Models/loot-score.model";

export class MinimalVisualizationEmbed extends RichEmbed {
    private _timestampHelper: TimestampHelper = new TimestampHelper();

    constructor(private lootScoreMap: Map<GuildMember, MemberScore>, title: string) {
        super();

        let memberLines: string = '';

        for (let member of lootScoreMap) {
            memberLines += `**${member[0].displayName}**: ${member[1].attendancePercentage}% / ${member[1].seniorityPercentage}% / ${member[1].lootScore} \n`;
        }

        this.setTitle(title);
        this.addField('**Name**: Attendance / Seniority / LootScore', memberLines);
    }
}