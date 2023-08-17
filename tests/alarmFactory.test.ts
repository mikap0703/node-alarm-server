import {describe, expect, test} from '@jest/globals';
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

describe('AlarmFactory', () => {
    let alarmFactory: AlarmFactory,
        alarmFactory2: AlarmFactory;

    beforeEach(() => {
        alarmFactory = new AlarmFactory(mockLogger);
        alarmFactory2 = new AlarmFactory(mockLogger);
    });

    test('should initialize correctly', () => {
        // Test the constructor and initial values
        expect(alarmFactory.data.id).toBe('');
        expect(alarmFactory.data.origin).toBe('');
        // Add more assertions for other initial values
    });

    test('should set and get values correctly', () => {
        // Test setting and getting individual properties
        const id = '123';
        const origin = 'mail';
        alarmFactory.id(id);
        alarmFactory.origin(origin);
        // Test that the values are set correctly
        expect(alarmFactory.data.id).toBe(id);
        expect(alarmFactory.data.origin).toBe(origin);
    });

    test('compare by time', () => {
        alarmFactory.time(Date.now());
        alarmFactory2.time(Date.now() + 40000);

        expect(alarmFactory.compare(alarmFactory2)).toBe(0);

        alarmFactory.time(Date.now());
        alarmFactory2.time(Date.now() + 10000);

        expect(alarmFactory.compare(alarmFactory2)).toBe(1);
    });
});