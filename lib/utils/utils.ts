export default class Utils {
    public get timerHour(): string {
        return new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(new Date());
    }
}
