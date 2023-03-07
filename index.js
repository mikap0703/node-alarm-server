import path from "path";
import { fileURLToPath } from 'url';
import {config} from "dotenv";
config();
import fs from "fs";
import chalk from 'chalk';
import axios from "axios";
import MailHandler from "./email-handler.js";
import {DiveraHandler, AlamosHandler} from './apiHandler.js';

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
                let divera = new DiveraHandler(this.apiKey, this.logger, generalConfig)
                this.triggerAlarm = divera.triggerAlarm.bind(divera)
                break;
            case "Alamos":
                this.triggerAlarm = this.triggerAlamos;
                break;
        }

        if (generalConfig.mail) {
            let mail = new MailHandler(this.handleAlarm.bind(this), mailConfig, this.logger)
            mail.startConnection()
        }
        if (generalConfig.serial_dme) {
            // TODO: Serielle Auswertung
            this.logger.log('WARN', 'SERIAL DME - Auswertung noch nicht implementiert')
        }
    }

    handleAlarm(alarmInfo) {
        if (!this.doTriggerAlarm) {
            this.logger.log('INFO', 'Alarm nicht ausgelöst - Weiterleitung deaktiviert')
        }
        else {
            this.triggerAlarm(alarmInfo)
        }
    }
}

let alarmhandler = new AlarmHandler()