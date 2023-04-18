import DiveraHandler from './apiHandlers/diveraHandler.js';
import AlamosHandler from './apiHandlers/alamosHandler.js';
import MailHandler from "./emailHandler.js";
import DMEHandler from "./dmeHandler.js";

export default class AlarmHandler {
    constructor(config, logger) {
        this.config = config
        this.logger = logger

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
            this.dmeHandler = new DMEHandler(this.handleAlarm.bind(this), this.config.serialDME, this.config.alarmTemplates, this.logger)
            let testString = `11:11 11.11.22
SU04 VA
TEST-ILS-Einsatz Brand 1 Brand Container Kreuzung Sulzbacher Weg - Industriestraße Sulzbach Neuweiler`
            this.dmeHandler.handleData(testString)
            this.dmeHandler.start()
            this.logger.log('WARN', 'SERIAL DME - Auswertung noch nicht implementiert')
        }
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