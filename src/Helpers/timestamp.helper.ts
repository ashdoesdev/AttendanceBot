export class TimestampHelper {
    public get monthDayYearFormatted(): string {
        return `${new Date().getMonth()}-${new Date().getDate()}-${new Date().getFullYear()}`;
    }
}