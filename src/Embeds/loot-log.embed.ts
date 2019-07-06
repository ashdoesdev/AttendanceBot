import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";
import { ItemScore } from "Models/item-score.model";

export class LootLogEmbed extends RichEmbed {
    private _timestampHelper: TimestampHelper = new TimestampHelper();

    constructor(public itemScore: ItemScore, public name: string) {
        super();

        this.setDescription(`${name} | **${itemScore.displayName}** (${itemScore.score})`);
        this.setFooter(`Looted ${this._timestampHelper.monthDayYearFormatted}`);
    }
}