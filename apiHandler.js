import axios from "axios";

export class DiveraHandler {
    constructor(apiKey, logger) {
        this.apikey = apiKey
        this.logger = logger
        this.checkConnection()
    }

    triggerAlarm(alarmInfo) {
        axios.post('https://app.divera247.com/api/alarm', {
            accesskey: this.apikey,
            //group_ids: [109023], // TEST-GRUPPE
            title: alarmInfo.title,
            text: alarmInfo.text,
            address: alarmInfo.address
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

export class AlamosHandler {
    constructor(apiKey, logger) {
        this.apikey = apiKey
        this.logger = logger

        this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert')
    }

    triggerAlarm(alarmInfo) {
        this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert')
    }


}