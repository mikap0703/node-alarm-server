import axios from "axios";

export default class apiHandler {
    constructor(apiKey, logger) {
        this.apikey = apiKey;
        this.logger = logger;
        this.generalConfig = generalConfig;
        this.checkConnection();
    }

    triggerAlarm(alarm) {
        // Funktion, die den Alarm anhand des übergebenen Alarms auslöst
    }

    checkConnection() {
        // Funktion, die die API testet... Verifizierung des API-Schlüssels
    }
}