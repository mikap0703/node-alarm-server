import { SerialPort, ReadlineParser } from 'serialport';

export default class DmeHandler {
    constructor(triggerAlarm, dmeConfig, logger) {
        this.logger = logger;
        this.config = dmeConfig;
        this.path = this.config.comPort || '/dev/tty.usbserial-110';
        this.baudRate = this.config.baudRate || 9600;
        this.port = new SerialPort( {
            path: this.path,
            baudRate: this.baudRate,
            autoOpen: false,
        });
        this.parser = new ReadlineParser()

        this.port.pipe(this.parser)
        this.triggerAlarm = triggerAlarm;
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
            this.logger.log('INFO', 'Serieller Port geöffnet: ' + this.path + ', Baudrate: ' + this.baudRate);
        });

        this.parser.on('data', (data) => {
            // Entfernt Nicht-ASCII-Zeichen aus den empfangenen Daten.
            data = data.replace(/[^\x00-\x7F]/g, '');
            const dataArray = data.split(/\s{2,}/);
            // Verarbeitet die empfangenen Daten
            this.handleData(dataArray);
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
}
