import { type Alarm } from './Alarm.js'

export interface generalConfig {
  api: 'Divera' | 'Alamos' | 'Telegram' | 'Mock'
  apiKey: string
  timeout: number
  serialDME: boolean
  mail: boolean
  alarm: boolean
  defaultAlarmTitle: string

  [key: string]: any
}

export interface mailConfig {
  user: string
  password: string
  host: string
  port: number
  tls: boolean
  maxAge: number
  alarmSender: string
  alarmSubject: string
  alarmTemplateKeywords: Record<string, string>
  mailSchema: string
  stichwoerter: Record<string, string>

  [key: string]: any
}

export interface serialDMEConfig {
  port: string
  delimeter: string
  baudrate: number
  alarmList: string[]
  rics: Record<string, string>

  [key: string]: any
}

export interface config {
  general: generalConfig
  mail: mailConfig
  serialDME: serialDMEConfig
  alarmTemplates: Record<string, Alarm>
}
