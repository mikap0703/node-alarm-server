import express, { Router } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from "path";
import 'dotenv/config'
import jwt from "jsonwebtoken";
import {ILogger} from "./logger.js";
import {EventEmitter} from "node:events";

export default class Backend{
    private port: number;
    private readonly logger: ILogger;
    private emitter: EventEmitter;
    private app: any;
    private v1Router: Router;
    private readonly adminSecret: string;

    constructor(dirname: string, port: number, logger: ILogger, emitter: EventEmitter) {
        this.port = port;
        this.logger = logger;
        this.emitter = emitter;

        let adminSecret: string | undefined = process.env.API_ADMIN_SECRET
        if (adminSecret) {
            this.adminSecret = adminSecret;
        }
        else {
            this.adminSecret = "";
        }

        /*
        const file = join(dirname, "db", 'users.json');
        const adapter = new JSONFile(file)
        const defaultData = { users: [] }
        this.userDB = new Low(adapter, defaultData)
        */

        this.app = express();

        this.v1Router = Router();

        this.app.use(cors());
        this.app.use(bodyParser.json());

        this.app.use("/api/v1", this.v1Router);
    }

    async start() {
        //await this.userDB.read();
        // API
        this.v1Router.get("/healthcheck", (req, res) => {
            res.end('ok');
        });

        this.v1Router.post('/auth/login', async (req, res) => {
            let data = req.body;

            if (data.password === process.env.API_ADMIN_SECRET) {
                let token = await jwt.sign({
                    "login-time": Math.floor(Date.now() / 1000),
                }, this.adminSecret, { expiresIn: '5d' });

                return res.status(200).send({"msg": "Erfolgreich angemeldet!", "token": token});
            }
            else {
                return res.status(401).send({"msg": "Falsches Passwort!"});
            }
        })

        this.v1Router.post('/auth/signup', async (req, res) => {
            return res.status(405).send();
            /*

            Aktuell nicht benötigt, da Anmeldung via Admin Passwort, nicht Username, Passwort

            await this.userDB.read();
            let data = req.body;

            for (let i = 0; i < this.userDB.data.users.length; i++) {
                if (this.userDB.data.users[i].username === data.username) {
                    return res.status(409).send({"msg": `Username ${data.username} already exists`});
                }
            }

            if (data.adminSecret === process.env.API_ADMIN_SECRET) {
                bcrypt.hash(data.password, 10, async (err, hash) => {
                    if (err) {
                        this.logger.log("Error", err)
                    } else {
                        this.userDB.data.users.push({
                            "username": data.username,
                            "password": hash
                        })

                        await this.userDB.write();
                        let token = jwt.sign({
                            "username": data.username
                        }, process.env.API_ADMIN_SECRET, { expiresIn: '5d' });
                        return res.status(200).send({"msg": `Erfolgreich als ${data.username} angemeldet!`, "token": token});
                    }
                });
            }
             */
        })

        this.v1Router.post("/test/:type", this.authenticateToken, (req, res) => {
            let data = req.body;

            switch (req.params.type) {
                case "mail":
                    this.emitter.emit('mailData', {
                        id: 4711,
                        sender: data.sender,
                        subject: data.subject,
                        content: data.content,
                        date: Date.now()
                    })

                    break;
                case "dme":
                    this.emitter.emit('dmeData', {
                        content: data.content
                    })
                    break;
            }

            res.status(200).send({status: "ok"});
        });

        this.app.listen(this.port, () => {
            this.logger.log("INFO", "API listening on port " + this.port);
        });
    }

    async authenticateToken (req: any, res: any, next: any) {
        const token = req.headers["authorization"];

        if (token == null) return res.status(401).send({"err": "Nicht authorisiert!"})

        jwt.verify(token, this.adminSecret, (err: any) => {
            if (err) return res.sendStatus(403)
            next()
        })
    }
}