import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";
import { ItemScore, AwardedItem } from "Models/item-score.model";
import { LootScoreData } from "../Models/loot-score.model";

export class LootLogEmbed extends RichEmbed {
    private _timestampHelper: TimestampHelper = new TimestampHelper();

    constructor(public lootScoreData: LootScoreData<AwardedItem>) {
        super();

        this.setColor('#60b5bc');

        if (!lootScoreData.value.offspec) {
            this.addField(lootScoreData.value.member.displayName, `**${lootScoreData.value.item.displayName}**`);
        } else {
            this.addField(lootScoreData.value.member.displayName, `**${lootScoreData.value.item.displayName}** (offspec)`);
        }

        this.setFooter(`Awarded by ${lootScoreData.signature.requester} on ${this._timestampHelper.monthDayYearFormatted}`);
    }
}