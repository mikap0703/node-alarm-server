import express, { Router } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import 'dotenv/config'
import {ILogger} from "./logger.js";
import {EventEmitter} from "node:events";

let preSharedSecret: string | undefined = process.env.API_ADMIN_SECRET;

export default class Backend {
    private readonly port: number;
    private readonly logger: ILogger;
    private emitter: EventEmitter;
    private app: any;
    private readonly v1Router: Router;

    constructor(dirname: string, port: number, logger: ILogger, emitter: EventEmitter) {
        this.port = port;
        this.logger = logger;
        this.emitter = emitter;

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

            if (data.preSharedSecret === preSharedSecret) {
                /*
                let token = await jwt.sign({
                    "login-time": Math.floor(Date.now() / 1000),
                }, adminSecret, { expiresIn: '5d' });
                 */

                return res.status(200).send({"msg": "Erfolgreich angemeldet!"});
            }
            else {
                return res.status(401).send({"msg": "Falsches Passwort!"});
            }
        })

        this.v1Router.post("/test/:type", this.authenticate, (req, res) => {
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
                    console.log(data.content)
                    break;
            }

            res.status(200).send({status: "ok"});
        });

        this.v1Router.post("/settings", this.authenticate, (req, res) => {

        })

        this.app.listen(this.port, () => {
            this.logger.log("INFO", "API listening on port " + this.port);
        });
    }

    async authenticate (req: any, res: any, next: any) {
        const token = req.headers["authorization"];

        if (token == null) return res.status(401).send({"err": "Nicht authorisiert!"})
        if (token == preSharedSecret && token != '') {
            next();
        }
    }
}