import DiveraHandler from './apiHandlers/diveraHandler.js';
import AlamosHandler from './apiHandlers/alamosHandler.js';
import MailHandler from "./emailHandler.js";
import DMEHandler from "./dmeHandler.js";
import axios from "axios";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from "path";

export default class AlarmHandler {
    constructor(config, logger, emitter, dirname) {
        this.config = config;
        this.logger = logger;
        this.emitter = emitter;

        const file = join(dirname, "src", "db", 'alarms.json');
        const adapter = new JSONFile(file)
        const defaultData = { alarms: [] }
        this.alarmDB = new Low(adapter, defaultData)

        this.doTriggerAlarm = this.config.general.alarm;

        if (this.doTriggerAlarm) {
            this.logger.log('INFO', 'Alarmierung aktiv - Einkommende Alarmierungen werden sofort weitergeleitet!');
        } else {
            this.logger.log('WARN', 'Alarmierung nicht aktiv - Einkommende Alarmierungen werden nicht weitergeleitet!');
        }

        this.apiKey = this.config.general.apiKey;
        switch (this.config.general.api) {
            case "Divera":
                let divera = new DiveraHandler(this.apiKey, this.logger, this.config.general);
                this.triggerAlarm = divera.triggerAlarm.bind(divera);
                break;
            case "Alamos":
                let alamos = new AlamosHandler(this.apiKey, this.logger, this.config.general);
                this.triggerAlarm = alamos.triggerAlarm.bind(alamos);
                break;
        }

        this.timeout = 5000;
        this.logger.log('INFO', `Timeout - Alarmhandler wird in ${this.timeout / 1000} Sekunden gestartet`)
    }

    start() {
        this.emitter.on('alarm', (alarm) => {
            this.handleAlarm(alarm);
        });

        if (this.config.general.mail) {
            let newMailHandler = () => {return new MailHandler(this.config.mail, this.config.alarmTemplates, this.logger, this.emitter)};
            this.mailHandler = newMailHandler()
            this.mailHandler.start();

            this.emitter.on('restartMailHandler', () => {
                delete this.mailHandler;
                setTimeout(() => {
                    this.mailHandler = newMailHandler();
                    this.mailHandler.start();
                }, 2000);
            });

            this.emitter.on('mailData', (data) => {
                this.mailHandler.handleMailData(data.id, data.sender, data.subject, data.content, data.date);
            })
        }
        if (this.config.general.serialDME) {
            let newDmeHandler = () => {return new DMEHandler(this.config.serialDME, this.config.alarmTemplates, this.logger, this.emitter)};
            this.dmeHandler = newDmeHandler();
            this.dmeHandler.start();

            this.emitter.on('restartDmeHandler', () => {
                delete this.dmeHandler;
                setTimeout(() => {
                    this.dmeHandler = newDmeHandler();
                    this.dmeHandler.start();
                }, 2000);
            })

            this.emitter.on('dmeData', (data) => {
                console.log(data)
                this.dmeHandler.handleDMEData(data.content);
            })
        }
    }

    async handleAlarm(alarm) {
        if (!this.doTriggerAlarm) {
            this.logger.log('INFO', `Alarm nicht ausgelöst - Weiterleitung deaktiviert: ${this.logger.convertObject(alarm.data)}`);
        }
        else {
            this.logger.log('INFO', `Alarm wird ausgelöst: ${this.logger.convertObject(alarm.data)}`);
            this.triggerAlarm(alarm);
            if (alarm.data.webhooks !== []) {
                for (let webhook of alarm.data.webhooks) {
                    this.handleHook(webhook);
                }
            }
        }

        this.alarmDB.data.alarms.push(alarm.data)

        await this.alarmDB.write();
    }

    handleHook(url) {
        axios.get(url)
            .then((res) => {
                this.logger.log('INFO', `WebHook ${url} aufgerufen...Status ${res.status}`);
            })
            .catch((err) => {
                this.logger.log('ERROR', `Fehler beim Aufrufen des WebHooks ${url}`);
                this.logger.log('ERROR', this.logger.convertObject(err));
            })
    }
}