import { SerialPort, ReadlineParser } from 'serialport';
import AlarmBuilder from "./alarm.js";

export default class DMEHandler {
    constructor(dmeConfig, alarmTemplates, logger, emitter) {
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
            return;
        }
        this.port.open((err) => {
            if (err) {
                this.logger.log('ERROR', 'Fehler beim Öffnen des seriellen Ports: ' + err.message);
                return;
            }
            this.logger.log('INFO', 'Serieller Port geöffnet: ' + this.path + ', Baudrate: ' + this.baudrate);
        });

        this.parser.on('data', (data) => {
            // Entfernt Nicht-ASCII-Zeichen aus den empfangenen Daten.
            console.log(data);
            data = data.replace(/[^\x00-\x7F]/g, '');
            // Verarbeitet die empfangenen Daten
            this.handleData(data);
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

    handleData(dmeContent) {
        console.log(dmeContent);
        const [date, ric, msg] = dmeContent.split(/\r?\n|\r|\n/g).slice(-3);

        console.log(date);
        console.log(ric);
        console.log(msg)
        let alarm = new AlarmBuilder(this.logger);

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
            this.logger.log('INFO', `DME Alarm angekommen - RIC ${ric} - kein AlarmTemplate gefunden!`);
        }
        else {
            alarm.applyTemplate(this.alarmTemplates[alarmTemplate]);
        }
        this.emitter.emit('alarm', alarm);
    }
}
