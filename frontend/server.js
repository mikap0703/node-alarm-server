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
    constructor(dirname, port, logger, emitter) {
        this.dirname = dirname;
        this.port = port;
        this.logger = logger;
        this.emitter = emitter;
        this.serviceStatus = {};

        this.logDir = path.join(this.dirname, 'logs');
        this.tail = "";

        this.app = express();
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(dirname, 'frontend', 'views'));

        this.emitter.on('serviceStatus', (data) => this.serviceStatus = data);
    }

    start(){
        this.app.get('/', (req, res) => {
            const mailService = 1
            const dmeService = -1
            const network = 0
            res.render('status', {
                mailService: mailService,
                dmeService: dmeService,
                network: network
            });
        });

        this.app.get()

        this.app.listen(this.port, () => {
            console.log('Server listening on port ' + this.port);
        });
    }
}