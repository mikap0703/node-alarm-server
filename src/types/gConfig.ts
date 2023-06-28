export type gConfig = {
    api: "Divera" | "Alamos";
    apiKey: string;
    timeout: number;
    serialDME: boolean;
    mail: boolean;
    alarm: boolean;
    defaultAlarmTitle: string;
    [key: string]: any;
};