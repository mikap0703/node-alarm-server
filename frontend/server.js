import path from "path";
import fs from "fs";
import express from "express";
import http from "http";
import {Server} from "socket.io";
import {Tail} from "tail";

function getLogFiles(logDir) {
    return new Promise((resolve, reject) => {
        fs.readdir(logDir, (err, files) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(files.filter(file => path.extname(file) === '.log'));
        });
    });
}

function readLogFile(filePath, cb) {
    fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
        if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            return;
        }

        const lines = data.split('\n').filter(line => line.trim() !== '');
        cb(lines.join('\n'));
    });
}

export default class WebUI{
    constructor(dirname, port, logger) {
        this.dirname = dirname;
        this.port = port;
        this.logger = logger;
        this.logDir = path.join(this.dirname, 'logs');
        this.tail = "";

        const app = express();
        app.use(express.static(dirname + '/frontend'));
        this.server = http.createServer(app);
        this.io = new Server(this.server);
    }

    start(){
        this.io.on('connection', async(socket) => {
            this.logger.log('INFO', 'Socket connected: ' + socket.id);

            try {
                const logFiles = await getLogFiles(this.logDir);
                socket.emit('logFiles', logFiles);
            } catch (err) {
                console.error('Error getting log files:', err);
            }

            socket.on('selectLog', (filename) => {
                let logfile = path.join(this.logDir, filename);
                console.log('Selected log file: ' + logfile);
                try {
                    this.tail.unwatch();
                } catch (err) {}

                this.tail = new Tail(logfile);

                readLogFile(logfile, (content) => {
                    socket.emit('logContent', content);
                });

                this.tail.on('line', (line) => {
                    console.log(line)
                    socket.emit('logEntry', line);
                });

                this.tail.on('error', (error) => {
                    console.error(error);
                });

            });
        });
        this.server.listen(this.port, () => {
            console.log('Server listening on port ' + this.port);
        });
    }
}