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

    street(street: string): Alarm {
        this.data.address.street = street;
        return this.data;
    }

    city(city: string): Alarm {
        this.data.address.city = city;
        return this.data;
    }

    object(object: string): Alarm {
        this.data.address.object = object;
        return this.data;
    }

    objectId(objectId: string): Alarm {
        this.data.address.objectId = objectId;
        return this.data;
    }

    info(info: string): Alarm {
        this.data.address.info = info;
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

    import(data: Alarm): Alarm {
        this.data = data;
        return this.data;
    }

    export(): Alarm {
        return this.data;
    }

    compare(alarm: IAlarmFactory): number {
        const timestampDifference = Math.abs(this.data.time - alarm.export().time);

        if (timestampDifference >= 30000) {
            return 0;
        }

        console.log(this.computeCharacterSimilarity(this.calculateFrequency(this.data.address.street), this.calculateFrequency(alarm.export().address.street)));

        return 1;
    }

    calculateFrequency(str: String): Map<string, number> {
        let freqMap = new Map<string, number>;

        for (let c of str) {
            freqMap.set(c, (freqMap.get(c) || 0) + 1);
        }

        return freqMap;
    }


    computeCharacterSimilarity(freqMap1: Map<string, number>, freqMap2: Map<string, number>): number {
        const allChars = new Set([...freqMap1.keys(), ...freqMap2.keys()]);

        let intersectionCount = 0;
        let unionCount = 0;

        for (const char of allChars) {
            const freq1 = freqMap1.get(char) || 0;
            const freq2 = freqMap2.get(char) || 0;

            intersectionCount += Math.min(freq1, freq2);
            unionCount += Math.max(freq1, freq2);
        }

        const similarity = intersectionCount / unionCount;
        return similarity;
    }
}