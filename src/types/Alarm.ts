export type Address = {
    street: string;
    city: string;
    object: string;
    objectId: string;
    info: string;
};

export type MailData = {
    id: string;
    sender: string;
    subject: string;
    content: string;
    date: number;
};

export type DmeData = {
    content: string;
};

export type Alarm = {
    id: string;
    origin: string | "mail" | "dme";
    title: string;
    text: string;
    time: number;
    address: Address;
    groups: string[];
    vehicles: string[];
    members: string[];
    webhooks: string[];
    mailData: MailData;
    dmeData: DmeData;
};

export interface IAlarmFactory {
    applyTemplate(template: Alarm): Alarm;
    id(id: string): Alarm;
    origin(origin: "mail" | "dme"): Alarm;
    title(title: string): Alarm;
    text(text: string): Alarm;
    time(time: number): Alarm;
    data: Alarm;
    address(address: Address): Alarm;
    street(street: string): Alarm;
    city(city: string): Alarm;
    object(object: string): Alarm;
    objectId(objectId: string): Alarm;
    addressInfo(info: string): Alarm;
    groups(groups: string[]): Alarm;
    vehicles(vehicles: string[]): Alarm;
    members(members: string[]): Alarm;
    webhooks(webhooks: string[]): Alarm;
    mailData(data: MailData): Alarm;
    dmeData(data: DmeData): Alarm;
    import(data: Alarm): Alarm;
    export(): Alarm;
    compare(alarm: IAlarmFactory): number;
}

// enum with 3 possible values
export enum AlarmCompareResult {
    UPDATE_ALARM = 0,
    NEW_ALARM = 1,
    DESTROY_ALARM = 2
}