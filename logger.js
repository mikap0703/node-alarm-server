import chalk from "chalk";
import winston from "winston";

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

logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.debug('This is a debug message');
