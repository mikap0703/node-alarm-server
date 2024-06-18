import axios from 'axios'
import apiHandler from './apiHandler.js'
import { type Alarm, type IAlarmFactory } from '../types/Alarm.js'

export default class Divera extends apiHandler {
  triggerAlarm (alarmFactory: IAlarmFactory): void {
    let address: string
    const alarm: Alarm = alarmFactory.export()
    if (alarm.address.street !== '') {
      if (alarm.address.city !== '') {
        address = alarm.address.street + ', ' + alarm.address.city
      } else {
        address = alarm.address.street
      }
    } else {
      address = alarm.address.city
    }

    let desination = {
      destination: false,
      destination_lat: 0,
      destination_lng: 0,
      lat: 0,
      lng: 0
    }

    if (alarm.address.coords.lat && alarm.address.coords.lon) {
      desination = {
        destination: true,
        destination_lat: alarm.address.coords.lat,
        destination_lng: alarm.address.coords.lon,
        lat: alarm.address.coords.lat,
        lng: alarm.address.coords.lon
      }
    }

    axios
      .post('https://app.divera247.com/api/v2/alarms', {
        accesskey: this.apikey,
        Alarm: {
          priority: true,
          notification_type: '3', // Empfänger-Auswahl (1 = Ausgewählte Standorte (nur in der PRO-Version), 2 = Alle des Standortes, 3 = Ausgewählte Gruppen, 4 = Ausgewählte Benutzer)
          send_push: true,
          private: true,
          title: alarm.title,
          text: alarm.text,
          address,
          ...desination,
          scene_object: alarm.address.object,
          group: alarm.groups,
          vehicle: alarm.vehicles
        },
        instructions: {
          group: {
            mapping: 'title'
          },
          vehicle: {
            mapping: 'name'
          }
        }
      })
      .then((response) => {
        if (response.data.success === true) {
          const id: string = response.data.data.id
          alarmFactory.id(id)

          this.logger.log('INFO', 'Alarm wurde erfolgreich ausgelöst!')
        } else {
          this.logger.log(
            'ERROR',
            'Beim Auslösen des Alarms sind folgende Fehler aufgetreten:'
          )
          for (const notification of response.data.errors.notification_type) {
            const stringNotification: string = notification.toString()
            this.logger.log('ERROR', stringNotification)
          }
        }
      })
      .catch((error) => {
        this.logger.log(
          'ERROR',
          'Alarm konnte nicht ausgelöst werden: ' +
            this.logger.convertObject(error)
        )
      })
  }

  updateAlarm (alarmFactory: IAlarmFactory): void {
    let address: string
    const alarm: Alarm = alarmFactory.export()
    if (alarm.address.street !== '') {
      if (alarm.address.city !== '') {
        address = alarm.address.street + ', ' + alarm.address.city
      } else {
        address = alarm.address.street
      }
    } else {
      address = alarm.address.city
    }

    let desination = {
      destination: false,
      destination_lat: 0,
      destination_lng: 0,
      lat: 0,
      lng: 0
    }

    if (alarm.address.coords.lat && alarm.address.coords.lon) {
      desination = {
        destination: true,
        destination_lat: alarm.address.coords.lat,
        destination_lng: alarm.address.coords.lon,
        lat: alarm.address.coords.lat,
        lng: alarm.address.coords.lon
      }
    }

    axios
      .put('https://app.divera247.com/api/v2/alarms/' + alarm.id, {
        accesskey: this.apikey,
        Alarm: {
          priority: true,
          notification_type: '3', // Empfänger-Auswahl (1 = Ausgewählte Standorte (nur in der PRO-Version), 2 = Alle des Standortes, 3 = Ausgewählte Gruppen, 4 = Ausgewählte Benutzer)
          send_push: true,
          private: true,
          title: alarm.title,
          text: alarm.text,
          address,
          ...desination,
          scene_object: alarm.address.object,
          group: alarm.groups,
          vehicle: alarm.vehicles
        },
        instructions: {
          group: {
            mapping: 'title'
          },
          vehicle: {
            mapping: 'name'
          }
        }
      })
      .then((response) => {
        if (response.data.success === true) {
          this.logger.log('INFO', 'Alarm wurde erfolgreich aktualisiert!')
        } else {
          this.logger.log(
            'ERROR',
            'Beim Aktualisieren des Alarms sind folgende Fehler aufgetreten:'
          )
          for (const notification of response.data.errors.notification_type) {
            const stringNotification: string = notification.toString()
            this.logger.log('ERROR', stringNotification)
          }
        }
      })
      .catch((error) => {
        this.logger.log(
          'ERROR',
          'Alarm konnte nicht aktualisiert werden: ' +
            this.logger.convertObject(error)
        )
      })
  }

  checkConnection (): void {
    axios
      .get('https://app.divera247.com/api/v2/pull/all?', {
        params: {
          accesskey: this.apikey
        }
      })
      .then((res) => {
        this.instanceName = res.data.data.cluster.name
        this.logger.log(
          'INFO',
          `Divera API erfolgreich authorisiert (${this.instanceName})`
        )
      })
      .catch((error) => {
        this.logger.log(
          'ERROR',
          'Verbindung konnte nicht überprüft werden: ' +
            this.logger.convertObject(error)
        )
      })
  }
}
