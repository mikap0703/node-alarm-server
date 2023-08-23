// @ts-ignore
import {ILogger} from "../src/logger";
// @ts-ignore
import AlarmFactory from "../src/alarmFactory";

// Mock logger for testing purposes
const mockLogger: ILogger = {
    convertObject(o: any): string {
        return o.toString();
    },
    log(type: "INFO" | "WARN" | "ERROR", payload: string): void {
        console.log(type + " - " + payload)
    }
};

let af1: AlarmFactory = new AlarmFactory(mockLogger);
let af2: AlarmFactory = new AlarmFactory(mockLogger);

af1.address()