import { GuildMember } from "discord.js";
import { MinimalMember } from "../Models/AttendanceData";

export class MemberMatchHelper {
    public replaceMemberIdWithMember(members: GuildMember[], map: Map<any, any>): Map<GuildMember, any> {
        let memberMap = new Map<GuildMember, any>();

        for (let entry of map) {
            const member = members.find((x) => x.id === entry[0]);
            if (member) {
                memberMap.set(member, entry[1]);
            }
        }

        return memberMap;
    }

    public matchMemberFromId(members: Array<GuildMember | MinimalMember>, memberId: string): GuildMember | MinimalMember {
        return members.find((x) => x.id === memberId);
    }

    public matchMemberFromName(members: Array<GuildMember | MinimalMember>, displayName: string): GuildMember | MinimalMember {
        return members.find((x) => x.displayName.toLowerCase() === displayName.toLowerCase());
    }
}