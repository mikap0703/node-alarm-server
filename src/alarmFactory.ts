import {
  type Address,
  type Alarm,
  AlarmCompareResult,
  type DmeData,
  type IAlarmFactory,
  type MailData
} from './types/Alarm.js'
import { type ILogger } from './logger.js'

export default class AlarmFactory implements IAlarmFactory {
  public data: Alarm
  private readonly logger: ILogger

  constructor (logger: ILogger) {
    this.logger = logger
    this.data = {
      id: '',
      origin: '',
      title: '',
      text: '',
      time: Date.now(),
      address: {
        street: '',
        city: '',
        object: '',
        objectId: '',
        info: '',
        utm: '',
        coords: {
          lat: null,
          lon: null
        }
      },
      units: [],
      groups: [],
      vehicles: [],
      members: [],
      webhooks: [],
      mailData: {
        id: '',
        sender: '',
        subject: '',
        content: '',
        date: 0
      },
      dmeData: {
        content: ''
      }
    }
  }

  applyTemplate (template: Alarm): Alarm {
    let key: keyof Alarm
    for (key in template) {
      switch (key) {
        case 'title':
        case 'text':
          this.data[key] = template[key]
          break
        case 'groups':
        case 'vehicles':
        case 'members':
        case 'webhooks':
          this.data[key] = [...new Set([...this.data[key], ...template[key]])]
          break
      }
    }

    return this.data
  }

  id (id: string): Alarm {
    this.data.id = id
    return this.data
  }

  origin (origin: 'mail' | 'dme'): Alarm {
    this.data.origin = origin
    return this.data
  }

  title (title: string): Alarm {
    this.data.title = title
    return this.data
  }

  text (text: string): Alarm {
    this.data.text = text
    return this.data
  }

  addToText (text: string): Alarm {
    this.data.text += text
    return this.data
  }

  time (time: number): Alarm {
    this.data.time = time
    return this.data
  }

  address (address: Address): Alarm {
    this.data.address = address
    return this.data
  }

  street (street: string): Alarm {
    this.data.address.street = street
    return this.data
  }

  city (city: string): Alarm {
    this.data.address.city = city
    return this.data
  }

  utm (utmCoords: string): Alarm {
    this.data.address.utm = utmCoords
    return this.data
  }

  lat(lat: number): Alarm {
    if (!isNaN(lat)) {
      this.data.address.coords.lat = lat
    }
    return this.data;
  }

  lon(lon: number): Alarm {
    if (!isNaN(lon)) {
      this.data.address.coords.lon = lon
    }
    return this.data;
  }

  object (object: string): Alarm {
    this.data.address.object = object
    return this.data
  }

  objectId (objectId: string): Alarm {
    this.data.address.objectId = objectId
    return this.data
  }

  addressInfo (info: string): Alarm {
    this.data.address.info = info
    return this.data
  }

  addUnit (unit: string): Alarm {
    this.data.units.push(unit)
    return this.data
  }

  groups (groups: string[]): Alarm {
    this.data.groups = groups
    return this.data
  }

  vehicles (vehicles: string[]): Alarm {
    this.data.vehicles = vehicles
    return this.data
  }

  members (members: string[]): Alarm {
    this.data.members = members
    return this.data
  }

  webhooks (webhooks: string[]): Alarm {
    this.data.webhooks = webhooks
    return this.data
  }

  mailData (data: MailData): Alarm {
    this.data.mailData = data
    return this.data
  }

  dmeData (data: DmeData): Alarm {
    this.data.dmeData = data
    return this.data
  }

  import (data: Alarm): Alarm {
    this.data = data
    return this.data
  }

  export (): Alarm {
    return this.data
  }

  compare (compareToFactory: IAlarmFactory): AlarmCompareResult {
    const compareTo = compareToFactory.export()
    const thisAlarm = this.export()

    if (compareTo.time <= 0) {
        this.logger.log('INFO', 'Vergleichs-Alarm hat keinen Zeitstempel')
        return AlarmCompareResult.NEW_ALARM
    }

    this.logger.log('INFO', `Alarm wird mit vorherigem Alarm (${compareTo.title + " - " + new Date(compareTo.time).toLocaleString('de-DE')}) verglichen`)

    // todo: toggle different comparing categories (disable comparing by time etc...)
    // compare by time difference
    const timestampDifference = Math.abs(thisAlarm.time - compareTo.time)

    // todo: add timestampDifference to config
    if (timestampDifference >= 7000) {
      this.logger.log('DEBUG', 'Alarm ist kein Duplikat - Zeitstempel zu unterschiedlich (' + timestampDifference / 1000 + ')');
      return AlarmCompareResult.NEW_ALARM
    }

    if (thisAlarm.origin === 'mail') {
      return AlarmCompareResult.UPDATE_ALARM
    }

    // todo: compare categories
    // compare by title
    // compare by address
    // compare by compare keywords

    return AlarmCompareResult.DESTROY_ALARM
  }

  calculateCharFrequency (str: string): Map<string, number> {
    const charFrequency = new Map<string, number>()
    const normalizedStr = str.toLowerCase() // Normalize to lowercase for case insensitivity

    for (const char of normalizedStr) {
      if (char.match(/[a-z]/) !== null) {
        charFrequency.set(char, (charFrequency.get(char) ?? 0) + 1)
      }
    }

    return charFrequency
  }

  calculateSimilarity (str1: string, str2: string): number {
    const charFrequency1 = this.calculateCharFrequency(str1)
    const charFrequency2 = this.calculateCharFrequency(str2)

    // Calculate the total frequency of characters in both strings
    let totalFrequency1 = 0
    for (const freq of charFrequency1.values()) {
      totalFrequency1 += freq
    }

    let totalFrequency2 = 0
    for (const freq of charFrequency2.values()) {
      totalFrequency2 += freq
    }

    // Calculate the similarity score
    let similarityScore = 0
    for (const [char, freq] of charFrequency1) {
      if (charFrequency2.has(char)) {
        similarityScore += Math.min(
          freq / totalFrequency1,
          charFrequency2.get(char) ?? 0 / totalFrequency2
        )
      }
    }

    return similarityScore
  }
}
