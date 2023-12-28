import DiveraHandler from './apiHandlers/divera.js'
import AlamosHandler from './apiHandlers/alamos.js'
import MailHandler from './mail/mailHandler.js'
import DMEHandler from './dmeHandler.js'
import axios from 'axios'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from 'path'
import { type config } from './types/Config.js'
import { type ILogger } from './logger.js'
import { type EventEmitter } from 'node:events'
import { type Alarm, AlarmCompareResult, type IAlarmFactory } from './types/Alarm.js'
import { v4 as uuidv4 } from 'uuid'
import AlarmFactory from './alarmFactory.js'
import type Divera from './apiHandlers/divera.js'

interface TalarmDB {
  alarms: Alarm[]
}

export default class AlarmHandler {
  prevAlarm: Alarm
  timeout: number
  private readonly doTriggerAlarm: boolean
  private readonly apiKey: string
  private readonly config: config
  private readonly logger: ILogger
  private readonly emitter: EventEmitter
  private readonly alarmDB: Low<TalarmDB>
  private readonly triggerAlarm: OmitThisParameter<(alarm: Alarm) => void>
  private mailHandler?: MailHandler
  private dmeHandler?: DMEHandler
  private readonly api: Divera

  constructor (config: config, logger: ILogger, emitter: EventEmitter, dirname: string) {
    this.config = config
    this.logger = logger
    this.emitter = emitter

    const file = join(dirname, 'src', 'db', 'alarms.json')
    const defaultData: TalarmDB = { alarms: [] }

    const adapter = new JSONFile<TalarmDB>(file)
    this.alarmDB = new Low<TalarmDB>(adapter, defaultData)

    this.doTriggerAlarm = this.config.general.alarm

    this.prevAlarm = new AlarmFactory(logger).export()
    this.prevAlarm.time = Date.now() * -1

    if (this.doTriggerAlarm) {
      this.logger.log('INFO', 'Alarmierung aktiv - Einkommende Alarmierungen werden sofort weitergeleitet!')
    } else {
      this.logger.log('WARN', 'Alarmierung nicht aktiv - Einkommende Alarmierungen werden nicht weitergeleitet!')
    }

    this.apiKey = this.config.general.apiKey
    switch (this.config.general.api) {
      // TODO: Add Mock API Handler
      case 'Divera':
        this.api = new DiveraHandler(this.apiKey, this.logger, this.config.general)
        break
      case 'Alamos':
        this.api = new AlamosHandler(this.apiKey, this.logger, this.config.general)
        break
    }

    this.triggerAlarm = this.api.triggerAlarm.bind(this.api)

    this.timeout = 5000
    this.logger.log('INFO', `Timeout - Alarmhandler wird in ${this.timeout / 1000} Sekunden gestartet`)
  }

  start (): void {
    this.emitter.on('alarm', (alarm) => {
      if (alarm instanceof AlarmFactory) {
        void this.handleAlarm(alarm).then((a: IAlarmFactory): void => {
          this.prevAlarm = a.export()

          void this.alarmDB.read().then(() => {
            this.alarmDB.data.alarms.push(alarm.data)
          }).then(() => {
            void this.alarmDB.write().then(r => {
              this.logger.log('INFO', 'Alarm wurde gespeichert')
            })
          })
        })
      }
    })

    if (this.config.general.mail) {
      const newMailHandler = (): MailHandler => { return new MailHandler(this.config.mail, this.config.alarmTemplates, this.logger, this.emitter) }
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
          this.mailHandler.handleMailData(Number(data.id), String(data.sender), String(data.subject), String(data.content), Number(data.date))
        }
      })
    }
    if (this.config.general.serialDME) {
      const newDmeHandler = (): DMEHandler => { return new DMEHandler(this.config.serialDME, this.config.alarmTemplates, this.logger, this.emitter) }
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
          console.log(stringContent)
          this.dmeHandler.handleDMEData(stringContent)
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
      this.logger.log('INFO', `Alarm nicht ausgelöst - Weiterleitung deaktiviert: ${this.logger.convertObject(alarm.data)}`)
      return alarm
    }

    switch (alarm.compare(prev)) {
      case AlarmCompareResult.UPDATE_ALARM:
        alarm.id(prev.export().id)
        this.api.updateAlarm(alarm.export())
        this.logger.log('INFO', `Alarm wird aktualisiert: ${this.logger.convertObject(alarm.data)}`)
        break
      case AlarmCompareResult.NEW_ALARM:
        this.api.triggerAlarm(alarm.export())
        this.logger.log('INFO', `Alarm wird ausgelöst: ${this.logger.convertObject(alarm.data)}`)
        break
      default:
        this.logger.log('INFO', `Alarm wird nicht ausgelöst - Alarm ist ein Duplikat: ${this.logger.convertObject(alarm.data)}`)
        break
    }

    for (const webhook of alarm.export().webhooks) {
      this.handleHook(webhook)
    }

    return alarm
  }

  handleHook (url: string): void {
    axios.get(url)
      .then((res) => {
        this.logger.log('INFO', `WebHook ${url} aufgerufen...Status ${res.status}`)
      })
      .catch((err) => {
        this.logger.log('ERROR', `Fehler beim Aufrufen des WebHooks ${url}`)
        this.logger.log('ERROR', this.logger.convertObject(err))
      })
  }
}
