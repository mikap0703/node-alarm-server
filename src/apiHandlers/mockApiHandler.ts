import apiHandler from './apiHandler.js'
import { type Alarm, type IAlarmFactory } from '../types/Alarm.js'

export default class MockApiHandler extends apiHandler {
  triggerAlarm (alarmFactory: IAlarmFactory): void {
    this.logger.log('INFO', 'Trigger Alarm')
    const alarm: Alarm = alarmFactory.export()
    this.logger.log('DEBUG', this.logger.convertObject(alarm))
  }

  updateAlarm (alarmFactory: IAlarmFactory): void {
    this.logger.log('INFO', 'Update Alarm')
    const alarm: Alarm = alarmFactory.export()
    this.logger.log('INFO', this.logger.convertObject(alarm))
  }

  checkConnection (): void {
    this.logger.log('INFO', 'Mock connection is always stable :)')
  }
}
