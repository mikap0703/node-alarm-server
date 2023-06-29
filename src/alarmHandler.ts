import DiveraHandler from './apiHandlers/divera.js';
import AlamosHandler from './apiHandlers/alamos.js';
import MailHandler from "./emailHandler.js";
import DMEHandler from "./dmeHandler.js";
import axios from "axios";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from "path";
import {config} from "./types/Config.js";
import {ILogger} from "./logger.js";
import {EventEmitter} from "node:events";
import {Alarm} from "./types/Alarm.js";

type TalarmDB = {
    alarms: Alarm[];
}

export default class AlarmHandler {
    private config: config;
    private logger: ILogger;
    private emitter: EventEmitter;
    private alarmDB: Low<TalarmDB>;
    private readonly doTriggerAlarm: boolean;
    private triggerAlarm: OmitThisParameter<(alarm: Alarm) => void>;
    timeout: number;
    private readonly apiKey: string;
    private mailHandler?: MailHandler;
    private dmeHandler?: DMEHandler;

    constructor(config: config, logger: ILogger, emitter: EventEmitter, dirname: string) {
        this.config = config;
        this.logger = logger;
        this.emitter = emitter;

        const file = join(dirname, "src", "db", 'alarms.json');
        const defaultData: TalarmDB = { alarms: [] }

        const adapter = new JSONFile<TalarmDB>(file)
        this.alarmDB = new Low<TalarmDB>(adapter, defaultData)

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
            this.handleAlarm(alarm.data);
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
                if (this.mailHandler) {
                    this.mailHandler.handleMailData(data.id, data.sender, data.subject, data.content, data.date);
                }
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
                if (this.dmeHandler) {
                    console.log(data)
                    this.dmeHandler.handleDMEData(data.content);
                }
            })
        }
    }

    async handleAlarm(alarm: Alarm) {
        if (!this.doTriggerAlarm) {
            this.logger.log('INFO', `Alarm nicht ausgelöst - Weiterleitung deaktiviert: ${this.logger.convertObject(alarm)}`);
        }
        else {
            this.logger.log('INFO', `Alarm wird ausgelöst: ${this.logger.convertObject(alarm)}`);
            this.triggerAlarm(alarm);
            for (let webhook of alarm.webhooks) {
                this.handleHook(webhook);
            }
        }

        this.alarmDB.data.alarms.push(alarm)

        await this.alarmDB.write();
    }

    handleHook(url: string) {
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