import { GuildMember, TextChannel } from "discord.js";
import { MinimalMember, MemberScore, LootScoreData } from "../Models/loot-score.model";
import { LootLogService } from "../Services/loot-log.service";
import { AwardedItem } from "../Models/item-score.model";
import { MapSortHelper } from "./map-sort.helper";

export class StatsHelper {
    private _lootLogService = new LootLogService();
    private _mapSort = new MapSortHelper();

    public getAverageAttendance(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>, activeMembers: string[]): number {
        let memberCount = 0;
        let attendanceCount = 0;
        let filteredMap = this._mapSort.filterMembers(lootScoreMap, activeMembers);

        for (let entry of filteredMap) {
            memberCount++;
            attendanceCount += entry[1].attendancePercentage;
        }

        return attendanceCount / memberCount;
    }

    public getAverageSeniority(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>, activeMembers: string[]): number {
        let memberCount = 0;
        let seniorityCount = 0;
        let filteredMap = this._mapSort.filterMembers(lootScoreMap, activeMembers);

        for (let entry of filteredMap) {
            memberCount++;
            seniorityCount += entry[1].seniorityPercentage;
        }

        return seniorityCount / memberCount;
    }

    public async orderLootedItemsByCount(lootScoreMap: Map<GuildMember | MinimalMember, MemberScore>, lootLogChannel: TextChannel, members: GuildMember[]): Promise<Map<string, number>> {
        let allItemsAwarded = new Array<LootScoreData<AwardedItem>>();

        for (let entry of lootScoreMap) {
            let itemsLooted = await this._lootLogService.getLootHistory(entry[0], lootLogChannel, members);

            allItemsAwarded.push(...itemsLooted);
        }

        let simplifiedItems = new Array<string>();

        for (let item of allItemsAwarded) {
            simplifiedItems.push(item.value.item.displayName);
        }

        let frequenciesMap = this.getFrequenciesMap(simplifiedItems);
        let sortedMap = this._mapSort.sortFrequenciesMap(frequenciesMap);
        
        return sortedMap;
    }

    public getFrequenciesMap(array: Array<string>): Map<string, number> {
        return new Map([...new Set(array)].map(
            x => [x, array.filter(y => y === x).length]
        ));
    }
}