import path from "path";
import chalk from "chalk";
import {fileURLToPath} from "url";
import configChecker from "./config.js";
import AlarmHandler from "./alarmhandler.js";

class Logger {
    constructor(__dirname) {
        this.logDir = path.join(__dirname, 'logs');
    }

    log (type, payload) {
        let doLog = chalk.red
        switch (type) {
            case 'INFO':
                doLog = chalk.bold.green;
                break
            case 'WARN':
                doLog = chalk.bold.yellow
                break
            case 'ERROR':
                doLog = chalk.bold.red
                break
        }
        console.log(doLog(`[${type}] - ${payload}`))
    }

    convertObject (o) {
        return typeof(o) + ': ' + JSON.stringify(o, null, '\t')
    }
}


const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);
const configFolder = process.env.DEV_CONFIG_PATH || './config';
const configDir = path.join(dirname, configFolder);

const configs = new configChecker();
await configs.check(configDir);

const config = configs;

const logger = new Logger(dirname)

let alarmhandler = new AlarmHandler(config.config, logger);

function getLastMail() { // DEV
    this.logger.log('WARN', 'ACHTUNG - DEV-Modus aktiviert')
    var f = this.connection.seq.fetch('370:*', {
        bodies: '',
        struct: true
    })

    this.logger.log('INFO', `Warten auf neue Mails von ${this.alarmSender} mit dem Betreff ${this.alarmSubject}`)

    f.on('message', (msg, seqno) => {
        this.logger.log('INFO', '[MAIL] - ' + seqno);
        msg.on('body', (stream) => {
            var buffer = '';
            stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
                this.evalMail(buffer, seqno)
            });
        });

        msg.once('attributes', function (attrs) {
            // console.log('Attributes: %s', inspect(attrs, false, 8));
        });
    });

}