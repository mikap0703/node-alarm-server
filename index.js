import AlarmHandler from "./alarmhandler/alarmhandler.js";
import express from "express";
import {fileURLToPath} from "url";
import path from "path";


const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

let alarmhandler = new AlarmHandler(dirname);

await alarmhandler.start()
    .then(() => {
        startWebUI();
    })
    .catch((error) => {
        console.error('Error starting alarm:', error);
    });


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