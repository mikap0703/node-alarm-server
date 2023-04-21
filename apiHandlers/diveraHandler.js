import axios from "axios";

export default class DiveraHandler {
    constructor(apiKey, logger, generalConfig) {
        this.apikey = apiKey;
        this.logger = logger;
        this.generalConfig = generalConfig;
        this.checkConnection();
    }

    triggerAlarm(alarm) {
        let alarmInfo = alarm.data
        let address = ""
        if (alarmInfo.address.street != '') {
            if (alarmInfo.address.city != '') {
                address = alarmInfo.address.street + ', ' + alarmInfo.address.city;
            } else {
                address = alarmInfo.address.street
            }
        } else {
            address = alarmInfo.address.city
        }

        if (process.env.DEV_MODE == 1) { // DEV
            console.log(alarmInfo)
        }
        else {
            axios.post('https://app.divera247.com/api/v2/alarms', {
                accesskey: this.apikey,
                Alarm: {
                    priority: true,
                    notification_type: this.generalConfig.diveraSettings.notificationType, // Empfänger-Auswahl (1 = Ausgewählte Standorte (nur in der PRO-Version), 2 = Alle des Standortes, 3 = Ausgewählte Gruppen, 4 = Ausgewählte Benutzer)
                    foreign_id: alarmInfo.id,
                    send_push: true,
                    title: alarmInfo.title,
                    text: alarmInfo.text + '\n' + alarmInfo.address.info,
                    address: address,
                    scene_object: alarmInfo.address.object,
                    group: alarmInfo.groups,
                    vehicle: alarmInfo.vehicles
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
                    }
                    else {
                        this.logger.log('ERROR', 'Beim Auslösen des Alarms ist ein Fehler aufgetreten!');
                    }
                })
                .catch((error) => {
                    this.logger.log('ERROR', 'Alarm konnte nicht ausgelöst werden: ' + this.logger.convertObject(error));
                });
        }
    }

    checkConnection() {
        axios.get('https://app.divera247.com/api/v2/pull/all?', { params: {
                accesskey: this.apikey
            }}).then((res) => {
            this.logger.log('INFO', `Divera API erfolgreich authorisiert (${res.data.data.cluster.name})`)
            let alarmNotificationSettings = res.data.data.cluster.settings.alarm_notification_primary
            if (alarmNotificationSettings[0] != '') {
                this.logger.log('INFO', `Es sind ${alarmNotificationSettings.length} Möglichkeiten zur Alarmierung hinterlegt: ${alarmNotificationSettings}`)
            } else {
                this.logger.log('WARN', `Es sind keine Kanäle zur Alarmierung eingerichtet. (Divera -> Verwaltung -> Meldungen -> Alarmierungen -> Über diese Kanäle alarmieren)`)
            }
        })
    }
}