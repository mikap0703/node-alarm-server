import DiveraHandler from './apiHandlers/divera.js';
import AlamosHandler from './apiHandlers/alamos.js';
import MailHandler from "./mail/mailHandler.js";
import DMEHandler from "./dmeHandler.js";
import axios from "axios";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from "path";
import { config } from "./types/Config.js";
import { ILogger } from "./logger.js";
import { EventEmitter } from "node:events";
import {Alarm, AlarmCompareResult, IAlarmFactory} from "./types/Alarm.js";
import { v4 as uuidv4 } from 'uuid';
import AlarmFactory from "./alarmFactory.js";
import Divera from "./apiHandlers/divera.js";

type TalarmDB = {
    alarms: Alarm[];
}

export default class AlarmHandler {
    private readonly doTriggerAlarm: boolean;
    private readonly apiKey: string;
    private config: config;
    private readonly logger: ILogger;
    private readonly emitter: EventEmitter;
    private alarmDB: Low<TalarmDB>;
    private readonly triggerAlarm: OmitThisParameter<(alarm: Alarm) => void>;
    private mailHandler?: MailHandler;
    private dmeHandler?: DMEHandler;
    prevAlarm: Alarm;
    timeout: number;
    private api: Divera;

    constructor(config: config, logger: ILogger, emitter: EventEmitter, dirname: string) {
        this.config = config;
        this.logger = logger;
        this.emitter = emitter;

        const file = join(dirname, "src", "db", 'alarms.json');
        const defaultData: TalarmDB = { alarms: [] }

        const adapter = new JSONFile<TalarmDB>(file)
        this.alarmDB = new Low<TalarmDB>(adapter, defaultData)

        this.doTriggerAlarm = this.config.general.alarm;

        this.prevAlarm = new AlarmFactory(logger).export();
        this.prevAlarm.time = Date.now() * -1;

        if (this.doTriggerAlarm) {
            this.logger.log('INFO', 'Alarmierung aktiv - Einkommende Alarmierungen werden sofort weitergeleitet!');
        } else {
            this.logger.log('WARN', 'Alarmierung nicht aktiv - Einkommende Alarmierungen werden nicht weitergeleitet!');
        }

        this.apiKey = this.config.general.apiKey;
        switch (this.config.general.api) {
            case "Divera":
                let divera = new DiveraHandler(this.apiKey, this.logger, this.config.general);
                this.api = divera;
                this.triggerAlarm = divera.triggerAlarm.bind(divera);
                break;
            case "Alamos":
                let alamos = new AlamosHandler(this.apiKey, this.logger, this.config.general);
                this.api = alamos;
                this.triggerAlarm = alamos.triggerAlarm.bind(alamos);
                break;
        }

        this.timeout = 5000;
        this.logger.log('INFO', `Timeout - Alarmhandler wird in ${this.timeout / 1000} Sekunden gestartet`)
    }

    start() {
        this.emitter.on('alarm', (alarm) => {
            this.handleAlarm(alarm).then(async (a: IAlarmFactory) => {
                this.prevAlarm = a.export();

                await this.alarmDB.read();
                this.alarmDB.data.alarms.push(alarm.data);
                await this.alarmDB.write();
            })
        });

        if (this.config.general.mail) {
            let newMailHandler = () => { return new MailHandler(this.config.mail, this.config.alarmTemplates, this.logger, this.emitter) };
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

    async handleAlarm(alarm: IAlarmFactory) {
        if (alarm.export().id === "") {
            alarm.id(uuidv4());
        }

        const prev = new AlarmFactory(this.logger);
        prev.import(this.prevAlarm);

        if (!this.doTriggerAlarm) {
            this.logger.log('INFO', `Alarm nicht ausgelöst - Weiterleitung deaktiviert: ${this.logger.convertObject(alarm.data)}`);
            return alarm;
        }


        switch (alarm.compare(prev)) {
            case AlarmCompareResult.UPDATE_ALARM:
                alarm.id(prev.export().id);
                this.api.updateAlarm(alarm.export());
                this.logger.log('INFO', `Alarm wird aktualisiert: ${this.logger.convertObject(alarm.data)}`);
                break;
            case AlarmCompareResult.NEW_ALARM:
                this.api.triggerAlarm(alarm.export());
                this.logger.log('INFO', `Alarm wird ausgelöst: ${this.logger.convertObject(alarm.data)}`);
                break;
            default:
                this.logger.log('INFO', `Alarm wird nicht ausgelöst - Alarm ist ein Duplikat: ${this.logger.convertObject(alarm.data)}`);
                break

        }

        for (const webhook of alarm.export().webhooks) {
            this.handleHook(webhook);
        }

        return alarm;
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