import { RichEmbed, GuildMember } from "discord.js";
import { TimestampHelper } from "../Helpers/timestamp.helper";
import { MemberScore, LootScoreData } from "../Models/loot-score.model";
import { AwardedItem } from "../Models/item-score.model";

export class LastRaidLootEmbed extends RichEmbed {
    constructor(private itemsLooted: LootScoreData<AwardedItem>[], first?: boolean, last?: boolean) {
        super();

        let raidDate = new Date(itemsLooted[0].signature.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' });

        let itemLines: string = '';
        let itemTop = '╔════════════════════════════════════╦════════════════════╗\n';
        let itemSeparator = '╠════════════════════════════════════╬════════════════════╣\n';
        let itemBottom = '╚════════════════════════════════════╩════════════════════╝\n';
        let itemHeader = '║ [Item Name]                        ║ [Awarded To]       ║\n';

        for (let item of itemsLooted) {
            itemLines += itemSeparator;

            let itemName = item.value.item.displayName.slice(0, 34).padEnd(34, ' ');
            let awardedTo = item.value.member.displayName.slice(0, 18).padEnd(18, ' ');
       
            itemLines += `║ ${itemName} ║ ${awardedTo} ║\n`;
        }

        this.setColor('#60b5bc');

        if (first && last) {
            this.setTitle(`Items Looted Last Raid (**${raidDate}**)`);
            this.setDescription(this.codeBlockify(itemTop + itemHeader + itemLines + itemBottom));
        } else if (first) {
            this.setTitle(`Items Looted Last Raid (**${raidDate}**)`);
            this.setDescription(this.codeBlockify(itemTop + itemHeader + itemLines));
        } else if (last) {
            this.setDescription(this.codeBlockify(itemLines + itemBottom));
        } else {
            this.setDescription(this.codeBlockify(itemLines));
        }

    }

    private codeBlockify(string: string): string {
        return '```ini\n' + string + '```';
    }
}

