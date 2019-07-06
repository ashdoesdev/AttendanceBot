"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TimestampHelper {
    get monthDayYearFormatted() {
        return `${new Date().getMonth()}-${new Date().getDate()}-${new Date().getFullYear()}`;
    }
}
exports.TimestampHelper = TimestampHelper;
