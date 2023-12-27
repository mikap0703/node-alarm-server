import axios from "axios";
import apiHandler from "./apiHandler.js";
import {Alarm} from "../types/Alarm.js";

export default class Divera extends apiHandler {
    triggerAlarm(alarm: Alarm) {
        let address = ""
        if (alarm.address.street != '') {
            if (alarm.address.city != '') {
                address = alarm.address.street + ', ' + alarm.address.city;
            } else {
                address = alarm.address.street
            }
        } else {
            address = alarm.address.city
        }

        this.logger.log('INFO', `Alarm wird ausgelöst: ${this.logger.convertObject(alarm)}`);

        axios.post('https://app.divera247.com/api/v2/alarms', {
            accesskey: this.apikey,
            Alarm: {
                priority: true,
                notification_type: "3", // Empfänger-Auswahl (1 = Ausgewählte Standorte (nur in der PRO-Version), 2 = Alle des Standortes, 3 = Ausgewählte Gruppen, 4 = Ausgewählte Benutzer)
                foreign_id: alarm.id,
                send_push: true,
                title: alarm.title,
                text: alarm.text + '\n' + alarm.address.info,
                address: address,
                scene_object: alarm.address.object,
                group: alarm.groups,
                vehicle: alarm.vehicles
            },
            instructions: {
                group: {
                    mapping: "title"
                },
                vehicle: {
                    mapping: "name"
                }
            }
        })
            .then((response) => {
                if (response.data.success) {
                    this.logger.log('INFO', 'Alarm wurde erfolgreich ausgelöst!');
                } else {
                    this.logger.log('ERROR', 'Beim Auslösen des Alarms sind folgende Fehler aufgetreten:');
                    for (let notification of response.data.errors.notification_type) {
                        this.logger.log('ERROR', notification)
                    }
                }
            })
            .catch((error) => {
                this.logger.log('ERROR', 'Alarm konnte nicht ausgelöst werden: ' + this.logger.convertObject(error));
            });
    }

    updateAlarm = this.triggerAlarm;

    checkConnection() {
        axios.get('https://app.divera247.com/api/v2/pull/all?', {
            params: {
                accesskey: this.apikey
            }
        })
            .then((res) => {
                this.instanceName = res.data.data.cluster.name;
                this.logger.log('INFO', `Divera API erfolgreich authorisiert (${this.instanceName})`)
            })
            .catch((error) => {
                this.logger.log('ERROR', 'Verbindung konnte nicht überprüft werden: ' + this.logger.convertObject(error));
            });
    }
}