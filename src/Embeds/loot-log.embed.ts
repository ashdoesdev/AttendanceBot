import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";
import { ItemScore } from "Models/item-score.model";

export class LootLogEmbed extends RichEmbed {
    private _timestampHelper: TimestampHelper = new TimestampHelper();

    constructor(public itemScore: ItemScore, public name: string, public requester: string) {
        super();

        this.addField(name, `**${itemScore.displayName}** (${itemScore.score})`)
        this.setFooter(`Awarded by ${requester} on ${this._timestampHelper.monthDayYearFormatted}`);
    }
}