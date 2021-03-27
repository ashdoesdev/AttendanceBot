import { GuildMember } from "discord.js";

export class Attendance {
    public memberLootScores: Map<GuildMember, MemberAttendance>;
}

export class MemberAttendance {
    public attendancePercentage: number = 0;
    public seniorityPercentage: number = 0;
}

export class AttendanceEntry<T> {
    public value: T;
    public signature: Signature;
}

export class Signature {
    public requester: MinimalMember;
    public timestamp: string;
}

export class MinimalMember {
    public id: string;
    public displayName: string;
}