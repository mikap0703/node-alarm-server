import apiHandler, {ApiHandler} from "./apiHandler.js";
import {Alarm} from "../types/Alarm.js";

export default class AlamosHandler extends apiHandler implements ApiHandler{
    triggerAlarm(alarm: Alarm) {
        this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert');
    }

    checkConnection() {
        // Funktion, die die API testet... Verifizierung des API-Schlüssels
    }
}