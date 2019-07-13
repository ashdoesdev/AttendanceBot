﻿import { Message } from "discord.js";
import { LootScoreData, Signature, MinimalMember } from "../Models/loot-score.model";

export class LootScoreDataHelper {
    public createLootScoreData(value: any, message: Message): LootScoreData<any> {
        let data = new LootScoreData<any>();
        data.value = value;
        data.signature = new Signature();
        data.signature.requester = new MinimalMember();
        data.signature.requester.id = message.member.id;
        data.signature.requester.displayName = message.member.displayName;
        data.signature.timestamp = new Date().toISOString();

        return data;
    }
}