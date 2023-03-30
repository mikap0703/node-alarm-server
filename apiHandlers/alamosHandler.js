import axios from "axios";

export class AlamosHandler {
    constructor(apiKey, logger) {
        this.apikey = apiKey;
        this.logger = logger;
        this.generalConfig = generalConfig;
        this.checkConnection();

        this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert');
    }

    triggerAlarm(alarmInfo) {
        this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert');
    }

    checkConnection() {
        // Funktion, die die API testet...Verifizierung des API-Schlüssels
    }
}