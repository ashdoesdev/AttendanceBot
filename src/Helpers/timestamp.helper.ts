export class TimestampHelper {
    public get monthDayYearFormatted(): string {
        return `${new Date().getMonth() + 1}-${new Date().getDate()}-${new Date().getFullYear()}`;
    }
}