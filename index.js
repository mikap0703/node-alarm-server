import path from "path";
import { fileURLToPath } from 'url';
import {config} from "dotenv";
config();
import fs from "fs";
import chalk from 'chalk';
import MailHandler from "./email-handler.js";
import {DiveraHandler, AlamosHandler} from './apiHandler.js';
import configChecker from "./config.js";

class Logger {
    constructor(__dirname) {
        this.logDir = path.join(__dirname, 'logs');
    }

    log (type, payload) {
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
                break
        }
        console.log(doLog(`[${type}] - ${payload}`))
    }

    convertObject (o) {
        return typeof(o) + ': ' + JSON.stringify(o, null, '\t')
    }
}

class AlarmHandler {
    constructor() {
        // Konfiguration laden
        const __filename = fileURLToPath(import.meta.url);
        this.dirname = path.dirname(__filename);

        this.logger = new Logger(this.dirname)

        this.configChecker = new configChecker();
    }

    async start() {
        await this.loadConfig()

        this.doTriggerAlarm = this.config.general.alarm

        if (this.doTriggerAlarm) {
            this.logger.log('INFO', 'Alarmierung aktiv - Einkommende Alarmierungen werden sofort weitergeleitet!')
        } else {
            this.logger.log('WARN', 'Alarmierung nicht aktiv - Einkommende Alarmierungen werden nicht weitergeleitet!')
        }

        this.apiKey = this.config.general.apiKey
        switch (this.config.general.api) {
            case "Divera":
                let divera = new DiveraHandler(this.apiKey, this.logger, this.config.general)
                this.triggerAlarm = divera.triggerAlarm.bind(divera)
                break;
            case "Alamos":
                this.triggerAlarm = this.triggerAlamos;
                break;
        }

        if (this.config.general.mail) {
            let mail = new MailHandler(this.handleAlarm.bind(this), this.config.mail, this.logger)
            mail.startConnection()
        }
        if (this.config.general.serial_dme) {
            // TODO: Serielle Auswertung
            this.logger.log('WARN', 'SERIAL DME - Auswertung noch nicht implementiert')
        }
    }

    async loadConfig() {
        const configFolder = process.env.DEV_CONFIG_PATH || './config';
        const configDir = path.join(this.dirname, configFolder);

        await this.configChecker.check(configDir);

        this.config = this.configChecker.config

        const mailConfigPath = path.join(configDir, 'mail.json');
        this.config.mail = JSON.parse(fs.readFileSync(mailConfigPath));

        const serialDmeConfigPath = path.join(configDir, 'serial-dme.json');
        this.config.serialDME = JSON.parse(fs.readFileSync(serialDmeConfigPath));

        const generalConfigPath = path.join(configDir, 'general.json');
        this.config.general = JSON.parse(fs.readFileSync(generalConfigPath));

        this.logger.log('INFO', 'Konfiguration ' + configDir + ' wurde geladen...')
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

let alarmhandler = new AlarmHandler();
await alarmhandler.start()