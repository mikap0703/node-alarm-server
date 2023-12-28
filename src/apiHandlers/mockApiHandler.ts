import apiHandler from "./apiHandler.js";
import { type Alarm } from "../types/Alarm.js";

export default class mockAPIHandler extends apiHandler {
  triggerAlarm(a: Alarm): void {
    this.logger.log("INFO", "Trigger Alarm");
    this.logger.log("INFO", this.logger.convertObject(a));
  }

  updateAlarm(a: Alarm): void {
    this.logger.log("INFO", "Trigger Alarm");
    this.logger.log("INFO", this.logger.convertObject(a));
  }

  checkConnection(): void {
    this.logger.log("INFO", "Mock connection is always stable :)");
  }
}
