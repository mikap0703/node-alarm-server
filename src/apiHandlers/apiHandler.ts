// import axios from 'axios'
import { type IAlarmFactory } from '../types/Alarm.js'
import { type ILogger } from '../logger.js'
import { type generalConfig } from '../types/Config.js'

export interface ApiHandler {
  triggerAlarm: (alarmFactory: IAlarmFactory) => void
  updateAlarm: (alarmFactory: IAlarmFactory) => void
  checkConnection: () => void
}

export default abstract class apiHandler implements ApiHandler {
  public instanceName: string
  protected apikey: string
  protected logger: ILogger
  protected generalConfig: any

  constructor (apiKey: string, logger: ILogger, generalConfig: generalConfig) {
    this.apikey = apiKey
    this.logger = logger
    this.generalConfig = generalConfig
    this.instanceName = ''
    this.checkConnection()
  }

  triggerAlarm (alarmFactory: IAlarmFactory): void {
    // Funktion, die den Alarm anhand des übergebenen Alarms auslöst
  }

  updateAlarm (alarmFactory: IAlarmFactory): void {
    // Funktion, die einen Alarm aktualisiert
  }

  checkConnection (): void {
    // Funktion, die die API testet... Verifizierung des API-Schlüssels
  }
}
