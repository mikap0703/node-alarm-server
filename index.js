require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios').default;
const MailHandler = require('./email-handler');

class Logger {
    constructor() {
    }

    log (type, msg) {
        console.log(`[${type}] - ${msg}`)
    }
}

class AlarmHandler {
    constructor() {
        this.logger = new Logger()
        // Konfiguration laden
        const configFolder = process.env.DEV_CONFIG_PATH || './config';
        const configDir = path.join(__dirname, configFolder);

        const mailConfigPath = path.join(configDir, 'mail.json');
        const mailConfig = JSON.parse(fs.readFileSync(mailConfigPath));

        const serialDmeConfigPath = path.join(configDir, 'serial-dme.json');
        const serialDmeConfig = JSON.parse(fs.readFileSync(serialDmeConfigPath));

        const generalConfigPath = path.join(configDir, 'general.json');
        const generalConfig = JSON.parse(fs.readFileSync(generalConfigPath));

        this.api_key = generalConfig.api_key
        switch (generalConfig.api) {
            case "Divera":
                this.triggerAlarm = this.triggerDivera;
                break;
            case "Alamos":
                this.triggerAlarm = this.triggerAlamos;
                break;
        }

        this.doTriggerAlarm = generalConfig.alarm

        if (generalConfig.mail) {
            let mail = new MailHandler(this.triggerAlarm, mailConfig, this.logger)
            mail.startConnection()
        }
        if (generalConfig.serial_dme) {
            // TODO: Serielle Auswertung
            console.log("SERIAL DME - Auswertung noch nicht implementiert")
        }
    }

    triggerDivera(alarmInfo) {
        if (!this.doTriggerAlarm) return "Alarm nicht ausgelöst"
        axios.post('https://app.divera247.com/api/alarm', {
            accesskey: this.api-key,
            group_ids: [109023], // TEST-GRUPPE
            title: alarmInfo.title,
            text: alarmInfo.text,
            address: alarmInfo.address
        })
            .then(function (response) {
                console.log(response.data.success);
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    triggerAlamos(alarmInfo) {
        if (!this.doTriggerAlarm) return "Alarm nicht ausgelöst"
        axios.post('https://app.divera247.com/api/alarm', {
            //accesskey: process.env.API_KEY,
            title: alarmInfo.title,
            message: alarmInfo.text,
            address: alarmInfo.address
        })
            .then(function (response) {
                console.log(response.data.success);
            })
            .catch(function (error) {
                console.log(error);
            });
    }
}

let alarmhandler = new AlarmHandler()