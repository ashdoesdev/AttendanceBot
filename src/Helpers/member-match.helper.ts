import { GuildMember } from "discord.js";

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

    public matchMemberFromId(members: GuildMember[], memberId: string): GuildMember {
        return members.find((x) => x.id === memberId);
    }

    public matchMemberFromName(members: GuildMember[], displayName: string): GuildMember {
        return members.find((x) => x.displayName.toLowerCase() === displayName.toLowerCase());
    }
}