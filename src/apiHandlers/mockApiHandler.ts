import apiHandler from './apiHandler.js'
import { type Alarm, type IAlarmFactory } from '../types/Alarm.js'

export default class MockApiHandler extends apiHandler {
  triggerAlarm (alarmFactory: IAlarmFactory): void {
    this.logger.log('INFO', 'Trigger Alarm')
    const alarm: Alarm = alarmFactory.export()
  }

  updateAlarm (alarmFactory: IAlarmFactory): void {
    this.logger.log('INFO', 'Update Alarm')
    const alarm: Alarm = alarmFactory.export()
  }

  checkConnection (): void {
    this.logger.log('INFO', 'Mock connection is always stable :)')
  }
}
