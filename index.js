import AlarmHandler from "./alarmhandler.js";
import {fileURLToPath} from "url";
import path from "path";
import configChecker from "./config.js";
import Logger from "./logger.js";
import WebUI from "./frontend/server.js";
import { EventEmitter } from 'node:events';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const logger = new Logger(dirname);

// Ordner, in dem sich die config YAML Dateien befinden wird angegeben
const configFolder = process.env.DEV_CONFIG_PATH || './config';
const configDir = path.join(dirname, configFolder);

const config = new configChecker(configDir, logger);
config.getYaml();

const emitter = new EventEmitter();

const alarmhandler = new AlarmHandler(config.config, logger, emitter);

// Alarmhandler wird nach einem Timeout gestartet
setTimeout(() => {
    alarmhandler.start()
}, alarmhandler.timeout);


const frontend = new WebUI(dirname, 8112, logger)
//frontend.start()