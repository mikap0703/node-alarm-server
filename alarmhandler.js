import path from "path";
import DiveraHandler from './apiHandlers/diveraHandler.js';
import AlamosHandler from './apiHandlers/alamosHandler.js';
import MailHandler from "./emailHandler.js";
import DMEHandler from "./dmeHandler.js";
import configChecker from "./config.js";
import fs from "fs";

export default class AlarmHandler {
    constructor(config, logger) {
        this.config = config
        this.logger = logger

        this.configChecker = new configChecker();

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
                let alamos = new AlamosHandler(this.apiKey, this.logger, this.config.general)
                this.triggerAlarm = alamos.triggerAlarm.bind(alamos);
                break;
        }
    }

    async start() {
        if (this.config.general.mail) {
            this.mailHandler = new MailHandler(this.handleAlarm.bind(this), this.config.mail, this.config.alarmTemplates, this.logger)
            this.mailHandler.start()
        }
        if (this.config.general.serialDME) {
            this.dmeHandler = new DMEHandler(this.handleAlarm.bind(this), this.config.serialDME, this.logger)
            this.dmeHandler.start()
            this.logger.log('WARN', 'SERIAL DME - Auswertung noch nicht implementiert')
        }
    }

    async loadConfig() {
        const configFolder = process.env.DEV_CONFIG_PATH || './config';
        const configDir = path.join(this.dirname, configFolder);

        await this.configChecker.check(configDir);

        this.config = this.configChecker;

        const mailConfigPath = path.join(configDir, 'mail.json');
        this.config.mail = JSON.parse(fs.readFileSync(mailConfigPath));

        const serialDmeConfigPath = path.join(configDir, 'serial-dme.json');
        this.config.serialDME = JSON.parse(fs.readFileSync(serialDmeConfigPath));

        const generalConfigPath = path.join(configDir, 'general.json');
        this.config.general = JSON.parse(fs.readFileSync(generalConfigPath));

        this.logger.log('INFO', 'Konfiguration ' + configDir + ' wurde geladen...');
    }

    handleAlarm(alarmInfo) {
        if (!this.doTriggerAlarm) {
            this.logger.log('INFO', 'Alarm nicht ausgelöst - Weiterleitung deaktiviert');
        }
        else {
            this.triggerAlarm(alarmInfo);
        }
    }
}