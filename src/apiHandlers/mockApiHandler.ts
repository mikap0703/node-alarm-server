import apiHandler from "./apiHandler.js";
import {Alarm} from "../types/Alarm.js";

export default class mockAPIHandler extends apiHandler {
    triggerAlarm(a: Alarm) {
        this.logger.log("INFO", "Trigger Alarm")
        this.logger.log("INFO", this.logger.convertObject(a));
    }

    updateAlarm(a: Alarm) {
        this.logger.log("INFO", "Trigger Alarm")
        this.logger.log("INFO", this.logger.convertObject(a));
    }

    checkConnection() {
        this.logger.log("INFO", "Mock connection is always stable :)")
    }
}