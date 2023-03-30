import AlarmHandler from "./alarmhandler.js";
import express from "express";
import {fileURLToPath} from "url";
import path from "path";
import configChecker from "./config.js";
import Logger from "./logger.js";

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

function startWebUI () {
    const app = express();
    const port = alarmhandler.config.general.webUIPort;

    app.get('/', (req, res) => {
        res.send(alarmhandler.status);
    });

    app.listen(port, () => {
        alarmhandler.logger.log('INFO', `WebUI gestartet auf Port ${port}`);
    });
}