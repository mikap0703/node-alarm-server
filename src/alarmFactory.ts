import {Address, Alarm, DmeData, IAlarmFactory, MailData} from "./types/Alarm.js";
import {ILogger} from "./logger.js";

export default class AlarmFactory implements IAlarmFactory{
    private logger: ILogger;
    public data: Alarm;

    constructor(logger: ILogger) {
        this.logger = logger;
        this.data = {
            id: "",
            origin: "",
            title: "",
            text: "",
            time: Date.now(),
            address: {
                street: "",
                city: "",
                object: "",
                objectId: "",
                info: "",
            },
            groups: [],
            vehicles: [],
            members: [],
            webhooks: [],
            mailData: {
                id: "",
                sender: "",
                subject: "",
                content: "",
                date: 0
            },
            dmeData: {
                content: ""
            }
        };
    }

    applyTemplate(template: Alarm): Alarm {
        let key: keyof Alarm;
        for (key in template) {
            switch (key) {
                case 'title':
                case 'text':
                    this.data[key] = template[key];
                    break;
                case 'groups':
                case 'vehicles':
                case 'members':
                case 'webhooks':
                    this.data[key] = [...new Set([...this.data[key], ...template[key]])]
                    break;
            }
        }

        return this.data;
    }

    id(id: string): Alarm {
        this.data.id = id;
        return this.data;
    }

    origin(origin: "mail" | "dme"): Alarm {
        this.data.origin = origin;
        return this.data;
    }

    title(title: string): Alarm {
        this.data.title = title;
        return this.data;
    }

    text(text: string): Alarm {
        this.data.title = text;
        return this.data;
    }

    time(time: number): Alarm {
        this.data.time = time;
        return this.data;
    }

    address(address: Address): Alarm {
        this.data.address = address;
        return this.data;
    }

    groups(groups: string[]): Alarm {
        this.data.groups = groups;
        return this.data;
    }

    vehicles(vehicles: string[]): Alarm {
        this.data.vehicles = vehicles;
        return this.data;
    }

    members(members: string[]): Alarm {
        this.data.members = members;
        return this.data;
    }

    webhooks(webhooks: string[]): Alarm {
        this.data.webhooks = webhooks;
        return this.data;
    }

    mailData(data: MailData): Alarm {
        this.data.mailData = data;
        return this.data;
    }

    dmeData(data: DmeData): Alarm {
        this.data.dmeData = data;
        return this.data;
    }

    compare(alarm: IAlarmFactory): number {

        return 1;
    }
}