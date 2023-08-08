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
    title(title: string): Alarm;
    text(text: string): Alarm;
    time(time: number): Alarm;
    data: Alarm;
    address(address: Address): Alarm;
    groups(groups: string[]): Alarm;
    vehicles(vehicles: string[]): Alarm;
    members(members: string[]): Alarm;
    webhooks(webhooks: string[]): Alarm;
    mailData(data: MailData): Alarm;
    dmeData(data: DmeData): Alarm;
}