import path from "path";
import { fileURLToPath } from 'url';
import {config} from "dotenv";
config();
import fs from "fs";
import chalk from 'chalk';
import axios from "axios";
import MailHandler from "./email-handler.js";

class Logger {
    constructor() {
    }

    log (type, msg) {
        let doLog = chalk.red
        switch (type) {
            case 'INFO':
                doLog = chalk.bold.green;
                break
            case 'WARN':
                doLog = chalk.bold.yellow
                break
            case 'ERROR':
                doLog = chalk.bold.yellow
        }
        console.log(doLog(`[${type}] - ${msg}`))
    }

    convertObject (o) {
        return typeof(o) + ': ' + JSON.stringify(o, null, '\t')
    }
}

class AlarmHandler {
    constructor() {
        this.logger = new Logger()
        // Konfiguration laden
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        console.log(__dirname)

        const configFolder = process.env.DEV_CONFIG_PATH || './config';
        const configDir = path.join(__dirname, configFolder);

        const mailConfigPath = path.join(configDir, 'mail.json');
        const mailConfig = JSON.parse(fs.readFileSync(mailConfigPath));


        const serialDmeConfigPath = path.join(configDir, 'serial-dme.json');
        const serialDmeConfig = JSON.parse(fs.readFileSync(serialDmeConfigPath));

        const generalConfigPath = path.join(configDir, 'general.json');
        const generalConfig = JSON.parse(fs.readFileSync(generalConfigPath));

        this.logger.log('INFO', 'Konfiguration ' + configDir + ' wurde geladen...')
        this.doTriggerAlarm = generalConfig.alarm

        if (this.doTriggerAlarm) {
            this.logger.log('INFO', 'Alarmierung aktiv - Einkommende Alarmierungen werden sofort weitergeleitet!')
        } else {
            this.logger.log('WARN', 'Alarmierung nicht aktiv - Einkommende Alarmierungen werden nicht weitergeleitet!')
        }

        this.apiKey = generalConfig.apiKey
        switch (generalConfig.api) {
            case "Divera":
                let divera = new DiveraHandler(this.apiKey, this.logger)

                this.triggerAlarm = divera.triggerAlarm
                this.triggerAlarm = this.triggerDivera;
                break;
            case "Alamos":
                this.triggerAlarm = this.triggerAlamos;
                break;
        }

        if (generalConfig.mail) {
            let mail = new MailHandler(this.handleAlarm, mailConfig, this.logger)
            mail.startConnection()
        }
        if (generalConfig.serial_dme) {
            // TODO: Serielle Auswertung
            this.logger.log('WARN', 'SERIAL DME - Auswertung noch nicht implementiert')
        }
    }

    handleAlarm(alarmInfo) {
        if (!this.doTriggerAlarm) {
            return "Alarm nicht ausgelöst"
        } else {
            this.triggerAlarm(alarmInfo)
        }
    }
}

class DiveraHandler {
    constructor(apiKey, logger) {
        this.apikey = apiKey
        this.logger = logger
        this.checkConnection()
    }

    triggerAlarm(alarmInfo) {
        if (!this.doTriggerAlarm) return "Alarm nicht ausgelöst"
        axios.post('https://app.divera247.com/api/alarm', {
            accesskey: this.apikey,
            group_ids: [109023], // TEST-GRUPPE
            title: alarmInfo.title,
            text: alarmInfo.text,
            address: alarmInfo.address
        })
            .then(function (response) {
                this.logger.log('INFO', this.logger.convertObject(response.data.success));
            })
            .catch(function (error) {
                this.logger.log('ERROR', error);
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

class AlamosHandler {
    constructor(apiKey, logger) {
        this.apikey = apiKey
        this.logger = logger

        this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert')
    }

    triggerAlarm(alarmInfo) {
        this.logger.log('ERROR', 'Alamos Anbindung ist nicht implementiert')
    }


}

let alarmhandler = new AlarmHandler()