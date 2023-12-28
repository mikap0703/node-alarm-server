// import axios from 'axios'
import { type Alarm } from "../types/Alarm.js";
import { type ILogger } from "../logger.js";
import { type gConfig } from "../types/gConfig.js";

export interface ApiHandler {
  triggerAlarm: (alarm: Alarm) => void;
  checkConnection: () => void;
}

export default abstract class apiHandler implements ApiHandler {
  public instanceName: string;
  protected apikey: string;
  protected logger: ILogger;
  protected generalConfig: any;

  constructor(apiKey: string, logger: ILogger, generalConfig: gConfig) {
    this.apikey = apiKey;
    this.logger = logger;
    this.generalConfig = generalConfig;
    this.instanceName = "";
    this.checkConnection();
  }

  triggerAlarm(a: Alarm): void {
    // Funktion, die den Alarm anhand des übergebenen Alarms auslöst
  }

  updateAlarm(a: Alarm): void {
    // Funktion, die einen Alarm aktualisiert
  }

  checkConnection(): void {
    // Funktion, die die API testet... Verifizierung des API-Schlüssels
  }
}
