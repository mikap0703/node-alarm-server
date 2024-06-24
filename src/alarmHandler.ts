import DiveraHandler from './apiHandlers/divera.js'
import AlamosHandler from './apiHandlers/alamos.js'
import MailHandler from './mail/mailHandler.js'
import DMEHandler from './dmeHandler.js'
import axios from 'axios'
import { type config } from './types/Config.js'
import { type ILogger } from './logger.js'
import { type EventEmitter } from 'node:events'
import {
  type Alarm,
  AlarmCompareResult,
  type IAlarmFactory
} from './types/Alarm.js'
import { v4 as uuidv4 } from 'uuid'
import AlarmFactory from './alarmFactory.js'
import MockApiHandler from './apiHandlers/mockApiHandler.js'
import type ApiHandler from './apiHandlers/apiHandler.js'
import TelegramHandler from './apiHandlers/telegram.js'

export default class AlarmHandler {
  prevAlarm: Alarm
  timeout: number
  private readonly doTriggerAlarm: boolean
  private readonly apiKey: string
  private readonly config: config
  private readonly logger: ILogger
  private readonly emitter: EventEmitter

  private mailHandler?: MailHandler
  private dmeHandler?: DMEHandler
  private readonly api: ApiHandler

  constructor (
    config: config,
    logger: ILogger,
    emitter: EventEmitter,
    dirname: string
  ) {
    this.config = config
    this.logger = logger
    this.emitter = emitter

    this.doTriggerAlarm = this.config.general.alarm

    this.prevAlarm = new AlarmFactory(logger).export()
    this.prevAlarm.time = Date.now() * -1

    if (this.doTriggerAlarm) {
      this.logger.log(
        'INFO',
        'Alarmierung aktiv - Einkommende Alarmierungen werden sofort weitergeleitet!'
      )
    } else {
      this.logger.log(
        'WARN',
        'Alarmierung nicht aktiv - Einkommende Alarmierungen werden nicht weitergeleitet!'
      )
    }

    this.apiKey = this.config.general.apiKey
    switch (this.config.general.api) {
      case 'Divera':
        this.api = new DiveraHandler(
          this.apiKey,
          this.logger,
          this.config.general
        )
        break
      case 'Alamos':
        this.api = new AlamosHandler(
          this.apiKey,
          this.logger,
          this.config.general
        )
        break
      case 'Telegram':
        this.api = new TelegramHandler(
          this.apiKey,
          this.logger,
          this.config.general
        )
        break
      case 'Mock':
      default:
        this.api = new MockApiHandler('asdf', this.logger, this.config.general)
        break
    }

    this.timeout = this.config.general.timeout

    if (this.timeout > 0) {
      this.logger.log(
          'INFO',
          `Timeout - Alarmhandler wird in ${
              this.timeout / 1000
          } Sekunden gestartet`
      )
    } else {
      this.logger.log('INFO', 'Alarmhandler wird gestartet')
    }
  }

  start (): void {
    this.emitter.on('alarm', (alarm) => {
      if (alarm instanceof AlarmFactory) {
        void this.handleAlarm(alarm).then((a: IAlarmFactory): void => {
          this.prevAlarm = a.export()
        })
      }
    })

    if (this.config.general.mail) {
      const newMailHandler = (): MailHandler => {
        return new MailHandler(
          this.config.mail,
          this.config.alarmTemplates,
          this.logger,
          this.emitter
        )
      }
      this.mailHandler = newMailHandler()
      this.mailHandler.start()

      this.emitter.on('restartMailHandler', () => {
        delete this.mailHandler
        setTimeout(() => {
          this.mailHandler = newMailHandler()
          this.mailHandler.start()
        }, 2000)
      })

      this.emitter.on('mailData', (data) => {
        if (this.mailHandler !== undefined) {
          this.mailHandler.handleMailData(
            Number(data.id),
            String(data.sender),
            String(data.subject),
            String(data.content),
            Number(data.date)
          )
        }
      })
    }
    if (this.config.general.serialDME) {
      const newDmeHandler = (): DMEHandler => {
        return new DMEHandler(
          this.config.serialDME,
          this.config.alarmTemplates,
          this.logger,
          this.emitter
        )
      }
      this.dmeHandler = newDmeHandler()
      this.dmeHandler.start()

      this.emitter.on('restartDmeHandler', () => {
        delete this.dmeHandler
        setTimeout(() => {
          this.dmeHandler = newDmeHandler()
          this.dmeHandler.start()
        }, 2000)
      })

      this.emitter.on('dmeData', (data) => {
        if (this.dmeHandler !== undefined) {
          const stringContent: string = data.content.toString() ?? ''
          let handleDMEresult = this.dmeHandler.handleDMEData(stringContent)
          if (!handleDMEresult) {
            this.logger.log("ERROR", "Fehler beim Auswerten der Nachricht:")
            this.logger.log("ERROR", stringContent)
          }
        }
      })
    }
  }

  async handleAlarm (alarm: IAlarmFactory): Promise<IAlarmFactory> {
    if (alarm.export().id === '') {
      alarm.id(uuidv4())
    }

    const prev = new AlarmFactory(this.logger)
    prev.import(this.prevAlarm)

    if (!this.doTriggerAlarm) {
      this.logger.log(
        'INFO',
        `Alarm nicht ausgelöst - Weiterleitung deaktiviert: ${this.logger.convertObject(
          alarm.data
        )}`
      )
      return alarm
    }

    switch (alarm.compare(prev)) {
      case AlarmCompareResult.UPDATE_ALARM:
        alarm.id(prev.export().id)
        this.api.updateAlarm(alarm)
        this.logger.log(
          'DEBUG',
          `Alarm wird aktualisiert: ${this.logger.convertObject(alarm.data)}`
        )
        break
      case AlarmCompareResult.NEW_ALARM:
        this.api.triggerAlarm(alarm)
        this.logger.log(
          'DEBUG',
          `Alarm wird ausgelöst: ${this.logger.convertObject(alarm.data)}`
        )
        break
      default:
        this.logger.log(
          'INFO',
          `Alarm wird nicht ausgelöst - Alarm ist ein Duplikat: ${this.logger.convertObject(
            alarm.data
          )}`
        )
        break
    }

    for (const webhook of alarm.export().webhooks) {
      this.handleHook(webhook)
    }

    return alarm
  }

  handleHook (url: string): void {
    axios
      .get(url)
      .then((res) => {
        this.logger.log(
          'INFO',
          `WebHook ${url} aufgerufen...Status ${res.status}`
        )
      })
      .catch((err) => {
        this.logger.log('ERROR', `Fehler beim Aufrufen des WebHooks ${url}`)
        this.logger.log('ERROR', this.logger.convertObject(err))
      })
  }
}
