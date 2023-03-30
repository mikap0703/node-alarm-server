import axios from "axios";

export class apiHandler {
    constructor(apiKey, logger) {
        this.apikey = apiKey;
        this.logger = logger
        this.generalConfig = generalConfig
        this.checkConnection()
    }

    triggerAlarm(alarmInfo) {
        // Funktion, die den Alarm anhand der übergebenen alarmInfos auslöst
    }

    checkConnection() {
        // Funktion, die die API testet...Verifizierung des API-Schlüssels
    }
}