import chalk from "chalk";
import winston from "winston";
import path from "path";

export default class Logger {
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


// Define the custom colors for each log level
const customColors = {
    error: chalk.red,
    warn: chalk.yellow,
    info: chalk.green,
    debug: chalk.blue
};

// Create the logger with the custom colors
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'M/d/YYYY - hh:mm' }),
        winston.format.printf(info => `${info.timestamp} ${customColors[info.level](info.level.toUpperCase())}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.printf(info => `${customColors[info.level](info.level.toUpperCase())}: ${info.message}`)
            )
        }),
        new winston.transports.File({
            filename: 'logs/info.log',
            level: 'info',
            format: winston.format.combine(
                winston.format.printf(info => `${info.timestamp} ${info.message}`)
            )
        }),
        new winston.transports.File({
            filename: 'logs/warn.log',
            level: 'warn',
            format: winston.format.combine(
                winston.format.printf(info => `${info.timestamp} ${info.message}`)
            )
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
                winston.format.printf(info => `${info.timestamp} ${info.message}`)
            )
        }),
        new winston.transports.File({
            filename: 'logs/debug.log',
            level: 'debug',
            format: winston.format.combine(
                winston.format.printf(info => `${info.timestamp} ${info.message}`)
            )
        })
    ],
    // Add the custom colors to the logger
    levels: Object.assign(winston.config.npm.levels, customColors)
});