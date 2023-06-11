import express, { Router } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join } from "path";
import 'dotenv/config'
import jwt from "jsonwebtoken";


export default class WebUI{
    constructor(dirname, port, logger, emitter) {
        this.port = port;
        this.logger = logger;
        this.emitter = emitter;

        const file = join(dirname, "db", 'users.json');
        const adapter = new JSONFile(file)
        const defaultData = { users: [] }
        this.userDB = new Low(adapter, defaultData)

        this.app = express();

        this.v1Router = Router();

        this.app.use(cors());
        this.app.use(bodyParser.json());

        this.app.use("/api/v1", this.v1Router);
    }

    async start() {
        await this.userDB.read();
        // API
        this.v1Router.get("/healthcheck", (req, res) => {
            res.end('ok');
        });

        this.v1Router.post('/auth/login', async (req, res) => {
            let data = req.body;

            if (data.password === process.env.API_ADMIN_SECRET) {
                let token = await jwt.sign({
                    "login-time": Math.floor(Date.now() / 1000),
                }, process.env.API_ADMIN_SECRET, { expiresIn: '5d' });

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
                        content: data.content,
                    })
                    break;
            }

            res.status(200).send({status: "ok"});
        });

        this.app.listen(this.port, () => {
            this.logger.log("INFO", "API listening on port " + this.port);
        });
    }

    async authenticateToken (req, res, next) {
        const token = req.headers["authorization"];

        if (token == null) return res.status(401).send({"err": "Nicht authorisiert!"})

        jwt.verify(token, process.env.API_ADMIN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403)
            next()
        })
    }
}