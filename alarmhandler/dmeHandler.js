import { SerialPort, ReadlineParser } from 'serialport'

export default class DmeHandler {
    constructor(triggerAlarm, dmeConfig, logger) {
        this.logger = logger;
        this.config = dmeConfig;
        this.port = new SerialPort({
            path: '/dev/tty.usbserial-110',
            baudRate: 9600,
            autoOpen: false
        })
        this.parser = new ReadlineParser()

        this.port.pipe(this.parser)
    }

    start() {
        this.port.open((err) => {
            if (err) {
                return this.logger.log('ERROR', 'Fehler beim Öffnen des Seriellen Ports: ' + err.message)
            }
        })

        this.parser.on('data', (data) => {
            data = data.replace(/[^\x00-\x7F]/g, '');
            console.log(data.split(/\s{2,}/));
        })

        this.port.on('end', () => {
            console.log('No more data');
        });
    }
}
