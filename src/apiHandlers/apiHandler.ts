import axios from "axios";
import {Alarm} from "../types/Alarm.js";
import {ILogger} from "../logger.js";
import {gConfig} from "../types/gConfig.js";

export interface ApiHandler {
    triggerAlarm(alarm: Alarm): void;
    checkConnection(): void;
}

export default abstract class apiHandler implements ApiHandler {
    protected apikey: string;
    protected logger: ILogger;
    protected generalConfig: any;
    public instanceName: string;
    constructor(apiKey: string, logger: ILogger, generalConfig: gConfig) {
        this.apikey = apiKey;
        this.logger = logger;
        this.generalConfig = generalConfig;
        this.instanceName = "";
        this.checkConnection();
    }

    triggerAlarm(a: Alarm) {
        // Funktion, die den Alarm anhand des übergebenen Alarms auslöst
    }

    updateAlarm(a: Alarm) {
        // Funktion, die einen Alarm aktualisiert
    }

    checkConnection() {
        // Funktion, die die API testet... Verifizierung des API-Schlüssels
    }
}