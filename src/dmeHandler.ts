import { SerialPort, ReadlineParser, SerialPortMock } from 'serialport';
import AlarmFactory from "./alarmFactory.js";
import {serialDMEConfig} from "./types/Config.js";
import {ILogger} from "./logger.js";
import {EventEmitter} from "node:events";
import {Alarm} from "./types/Alarm.js";

export default class DMEHandler {
    private config: serialDMEConfig;
    private alarmTemplates: Record<string, Alarm>;
    private logger: ILogger;
    private emitter: EventEmitter;
    private path: string;
    private baudrate: number;
    private port: SerialPort;
    private parser: ReadlineParser;

    constructor(dmeConfig: serialDMEConfig, alarmTemplates: Record<string, Alarm>, logger: ILogger, emitter: EventEmitter) {
        this.config = dmeConfig;
        this.alarmTemplates = alarmTemplates;
        this.logger = logger;
        this.emitter = emitter;

        this.path = this.config.port;
        this.baudrate = this.config.baudrate;
        this.port = new SerialPort({
            path: this.path,
            baudRate: this.baudrate,
            autoOpen: false,
        });

        this.parser = this.port.pipe(new ReadlineParser({delimiter: this.config.delimiter}));
    }

    start() {
        if (this.port.isOpen) {
            this.logger.log('WARN', 'Der serielle Port ist bereits geöffnet.');
            this.emitter.emit('restartDmeHandler');
            return;
        }
        this.port.open((err) => {
            if (err) {
                this.logger.log('ERROR', 'Fehler beim Öffnen des seriellen Ports: ' + err.message);
                this.emitter.emit('restartDmeHandler');
                return;
            }
            this.logger.log('INFO', 'Serieller Port geöffnet: ' + this.path + ', Baudrate: ' + this.baudrate);
        });

        this.parser.on('data', (data) => {
            // Entfernt Nicht-ASCII-Zeichen aus den empfangenen Daten.
            console.log(data);
            data = data.replace(/[^\x00-\x7F]/g, '');
            // Verarbeitet die empfangenen Daten
            this.handleDMEData(data);
        });

        this.port.on('data', (data) => {
            console.log(data);
        });

        this.port.on('close', () => {
            this.logger.log('WARN', 'Der serielle Port wurde geschlossen.');
        });

        this.port.on('error', (err) => {
            this.logger.log('ERROR', 'Fehler beim Lesen des seriellen Ports: ' + err.message);
        });
    }

    stop() {
        this.port.close((err) => {
            if (err) {
                this.logger.log('ERROR', 'Fehler beim Schließen des seriellen Ports: ' + err.message);
                return;
            }
            this.logger.log('INFO', 'Serieller Port geschlossen.');
        });
    }

    handleDMEData(dmeContent: string) {
        const [date, ric, msg] = dmeContent.split(/\r\n\0|\r\n|\n/).slice(-3);

        let alarm = new AlarmFactory(this.logger);

        alarm.applyTemplate(this.alarmTemplates['default']);

        for(let keyword of this.config.alarmList){
            if(msg.includes(keyword)) {
                alarm.data.title = keyword;
                break;
            }
        }

        alarm.data.text = msg;

        let alarmTemplate = this.config.rics[ric] || '';

        if (alarmTemplate === '') {
            this.logger.log('INFO', `DME Alarm angekommen - RIC "${ric}" - kein AlarmTemplate gefunden!`);
        }
        else {
            alarm.applyTemplate(this.alarmTemplates[alarmTemplate]);
        }

        alarm.data.dmeData.content = dmeContent;
        this.emitter.emit('alarm', alarm);
    }
}
