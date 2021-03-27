import { Message } from "discord.js";
import { AttendanceEntry, Signature, MinimalMember } from "../Models/AttendanceData";

export class AttendanceEntryHelper {
    public createAttendanceData(value: any, message: Message): AttendanceEntry<any> {
        let data = new AttendanceEntry<any>();
        data.value = value;
        data.signature = new Signature();
        data.signature.requester = new MinimalMember();
        data.signature.requester.id = message.member.id;
        data.signature.requester.displayName = message.member.displayName;
        data.signature.timestamp = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' });

        return data;
    }
}