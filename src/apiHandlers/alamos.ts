import apiHandler from './apiHandler.js'
import { type Alarm, type IAlarmFactory } from '../types/Alarm.js'

export default class AlamosHandler extends apiHandler {
  triggerAlarm (alarmFactory: IAlarmFactory): void {
    const alarm: Alarm = alarmFactory.export()
    this.logger.log('INFO', this.logger.convertObject(alarm))
    this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert')
  }

  updateAlarm (alarmFactory: IAlarmFactory): void {
    const alarm: Alarm = alarmFactory.export()
    this.logger.log('INFO', this.logger.convertObject(alarm))
    this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert')
  }

  checkConnection (): void {
    this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert')
  }
}
