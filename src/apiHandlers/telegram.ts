import apiHandler from './apiHandler.js'
import { type Alarm, type IAlarmFactory } from '../types/Alarm.js'
import { type generalConfig } from '../types/Config.js'
import { type ILogger } from '../logger.js'
import axios from 'axios'

export default class Telegram extends apiHandler {
  url: string
  messaageIDs: Array<[string, string]> = []

  constructor (apiKey: string, logger: ILogger, generalConfig: generalConfig) {
    super(apiKey, logger, generalConfig)
    this.url = 'https://api.telegram.org/bot' + this.apikey
  }

  private formatAlarm (alarm: Alarm): string {
    let text = '🚨' + alarm.title + ' 🚨\n\n' + alarm.text

    let address = ''

    if (alarm.address.street) {
      address += alarm.address.street + '\n'
    }

    if (alarm.address.city) {
      address += alarm.address.city + '\n'
    }

    if (alarm.address.object) {
      address += alarm.address.object + '\n'
    }

    text = text + '\n\n' + address

    return text
  }

  triggerAlarm (alarmFactory: IAlarmFactory): void {
    const alarm = alarmFactory.export()
    const text = this.formatAlarm(alarm)
    this.messaageIDs = []

    this.logger.log('INFO', 'Trigger Alarm')
    this.logger.log('INFO', text)
    for (const receiver of alarm.groups) {
      this.logger.log('INFO', 'Alarmiere ' + receiver)
      axios
        .post(this.url + '/sendMessage', {
          text,
          chat_id: receiver
        })
        .then((response) => {
          this.messaageIDs.push([
            receiver,
            response.data.result.message_id || ''
          ])
        })
    }
  }

  updateAlarm (alarmFactory: IAlarmFactory): void {
    this.logger.log('INFO', 'Update Alarm')
    const alarm: Alarm = alarmFactory.export()
    const text = this.formatAlarm(alarm)

    for (const message of this.messaageIDs) {
      axios
        .post(this.url + '/editMessageText', {
          text,
          chat_id: message[0],
          message_id: message[1]
        })
        .then((response) => {
          this.logger.log('INFO', 'Nachricht geupdated')
        })
    }
  }

  checkConnection (): void {
    this.logger.log('INFO', 'Mock connection is always stable :)')
  }
}
