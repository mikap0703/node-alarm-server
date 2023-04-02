import AlarmHandler from "./alarmhandler.js";
import {fileURLToPath} from "url";
import path from "path";
import configChecker from "./config.js";
import Logger from "./logger.js";
import WebUI from "./frontend/server.js";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const configFolder = process.env.DEV_CONFIG_PATH || './config';
const configDir = path.join(dirname, configFolder);

const configs = new configChecker();
await configs.check(configDir);
const config = configs;

const logger = new Logger(dirname);

const alarmhandler = new AlarmHandler(config.config, logger);
alarmhandler.start()

const frontend = new WebUI(dirname, 8112, logger)
frontend.start()