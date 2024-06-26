export interface Address {
  street: string
  city: string
  object: string
  objectId: string
  info: string
  utm: string
  coords: {
    lat: number | null
    lon: number | null
  }
}

export interface MailData {
  id: string
  sender: string
  subject: string
  content: string
  date: number
}

export interface DmeData {
  content: string
}

export interface Alarm {
  id: string
  origin: string | 'mail' | 'dme'
  title: string
  text: string
  time: number
  address: Address
  units: string[]
  groups: string[]
  vehicles: string[]
  members: string[]
  webhooks: string[]
  mailData: MailData
  dmeData: DmeData
}

export interface IAlarmFactory {
  applyTemplate: (template: Alarm) => Alarm
  id: (id: string) => Alarm
  origin: (origin: 'mail' | 'dme') => Alarm
  title: (title: string) => Alarm
  text: (text: string) => Alarm
  time: (time: number) => Alarm
  data: Alarm
  address: (address: Address) => Alarm
  street: (street: string) => Alarm
  city: (city: string) => Alarm
  utm: (utm: string) => Alarm
  lat: (lat: number) => Alarm
  lon: (lon: number) => Alarm
  object: (object: string) => Alarm
  objectId: (objectId: string) => Alarm
  addressInfo: (info: string) => Alarm
  addUnit: (unit: string) => Alarm
  groups: (groups: string[]) => Alarm
  vehicles: (vehicles: string[]) => Alarm
  members: (members: string[]) => Alarm
  webhooks: (webhooks: string[]) => Alarm
  mailData: (data: MailData) => Alarm
  dmeData: (data: DmeData) => Alarm
  import: (data: Alarm) => Alarm
  export: () => Alarm
  compare: (alarm: IAlarmFactory) => number
}

// enum with 3 possible values
export enum AlarmCompareResult {
  UPDATE_ALARM = 0,
  NEW_ALARM = 1,
  DESTROY_ALARM = 2,
}
