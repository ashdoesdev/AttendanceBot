"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AttendanceData_1 = require("../Models/AttendanceData");
class AttendanceEntryHelper {
    createAttendanceData(value, message) {
        let data = new AttendanceData_1.AttendanceEntry();
        data.value = value;
        data.signature = new AttendanceData_1.Signature();
        data.signature.requester = new AttendanceData_1.MinimalMember();
        data.signature.requester.id = message.member.id;
        data.signature.requester.displayName = message.member.displayName;
        data.signature.timestamp = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit', month: '2-digit', year: '2-digit' });
        return data;
    }
}
exports.AttendanceEntryHelper = AttendanceEntryHelper;
