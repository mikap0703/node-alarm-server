import apiHandler from "./apiHandler.js";
import { type Alarm } from "../types/Alarm.js";

export default class AlamosHandler extends apiHandler {
  triggerAlarm(alarm: Alarm): void {
    this.logger.log("ERROR", "Alamos Anbindung ist nicht implementiert");
  }

  updateAlarm(a: Alarm): void {
    this.logger.log("ERROR", "Alamos Anbindung ist nicht implementiert");
  }

  checkConnection(): void {
    this.logger.log("ERROR", "Alamos Anbindung ist nicht implementiert");
  }
}
