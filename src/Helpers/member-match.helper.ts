import { GuildMember } from "discord.js";

export class MemberMatchHelper {
    public replaceMemberIdWithMember(members: GuildMember[], map: Map<any, any>): Map<GuildMember, any> {
        for (let entry of map) {
            const member = members.find((x) => x.id === entry[0]);
            if (member) {
                if (!map.has(member)) {
                    map.set(member, entry[1]);
                    map.delete(entry[0]);
                }
            }
        }

        return map;
    }
}