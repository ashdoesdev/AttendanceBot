"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TimestampHelper {
    get monthDayYearFormatted() {
        return `${new Date().getMonth() + 1}-${new Date().getDate()}-${new Date().getFullYear()}`;
    }
}
exports.TimestampHelper = TimestampHelper;
