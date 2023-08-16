import { SerialPort, ReadlineParser } from 'serialport';
import AlarmFactory from "./alarmFactory.js";
import {serialDMEConfig} from "./types/Config.js";
import {ILogger} from "./logger.js";
import {EventEmitter} from "node:events";
import {Alarm} from "./types/Alarm.js";

export default class DMEHandler {
    private config: serialDMEConfig;
    private readonly alarmTemplates: Record<string, Alarm>;
    private readonly logger: ILogger;
    private readonly emitter: EventEmitter;
    private readonly path: string;
    private readonly baudrate: number;
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
        // preparing AlarmFactory
        let alarm = new AlarmFactory(this.logger);
        alarm.origin("dme");
        alarm.applyTemplate(this.alarmTemplates['default']);

        // parsing data from DME
        let [dateString, ric, msg] = dmeContent.split(/\r\n\0|\r\n|\n/).slice(-3);

        // extract the date and time components from the string
        const [time, date] = dateString.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        const [day, month, year] = date.split(".").map(Number);

        alarm.time(new Date(2000 + year, month - 1, day, hours, minutes).getTime() / 1000);

        for(let keyword of this.config.alarmList){
            if(msg.includes(keyword)) {
                alarm.title(keyword)
                break;
            }
        }

        alarm.text(msg);

        let template = this.config.rics[ric] || '';
        if (template === '') {
            this.logger.log('INFO', `DME Alarm angekommen - RIC "${ric}" - kein AlarmTemplate gefunden!`);
        }
        else {
            alarm.applyTemplate(this.alarmTemplates[template]);
        }

        alarm.dmeData({
            content: dmeContent
        })

        this.emitter.emit('alarm', alarm);
    }
}
