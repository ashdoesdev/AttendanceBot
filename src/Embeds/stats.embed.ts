import { GuildMember, RichEmbed } from "discord.js";
import { MemberScore } from "../Models/loot-score.model";

export class StatsEmbed extends RichEmbed {
    constructor(private lootScore: [GuildMember, MemberScore]) {
        super();

        this.setColor('#60b5bc');

        this.addField(`Stats for **${lootScore[0].displayName}**`,
            `**Attendance**: ${lootScore[1].attendancePercentage}%\n**Seniority**: ${lootScore[1].seniorityPercentage}%\n**Last Loot Date**: ${lootScore[1].lastLootDate}\n`);
    }
}

