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