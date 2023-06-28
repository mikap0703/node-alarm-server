import chalk from "chalk";
import path from "path";

type logType = "INFO" | "WARN" | "ERROR";
export default class Logger {
    private logDir: string;
    constructor(__dirname: string) {
        this.logDir = path.join(__dirname, 'logs');
    }

    log (type: logType, payload: string) {
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

    convertObject (o: any) {
        return typeof(o) + ': ' + JSON.stringify(o, null, '\t')
    }
}