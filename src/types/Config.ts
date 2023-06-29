import {Alarm} from "./Alarm.js";

export type generalConfig = {
    api: "Divera" | "Alamos";
    apiKey: string;
    timeout: number;
    serialDME: boolean;
    mail: boolean;
    alarm: boolean;
    defaultAlarmTitle: string;
    [key: string]: any;
};

export type mailConfig = {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
    maxAge: number;
    alarmSender: string;
    alarmSubject: string;
    alarmTemplateKeywords: Record<string, string>;
    mailSchema: string;
    stichwoerter: Record<string, string>;
    [key: string]: any;
}

export type serialDMEConfig = {
    port: string;
    delimeter: string;
    baudrate: number;
    alarmList: string[];
    rics: Record<string, string>
    [key: string]: any;
}

export type config = {
    general: generalConfig;
    mail: mailConfig;
    serialDME: serialDMEConfig;
    alarmTemplates: Alarm;
}