import express, { Router } from "express";
import bodyParser from "body-parser";
import cors from "cors";

export default class WebUI{
    constructor(dirname, port, logger, emitter) {
        this.port = port;
        this.logger = logger;
        this.emitter = emitter;

        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());

    }

    start(){
        // API
        const v1Router = Router();
        this.app.use("/api/v1", v1Router);

        v1Router.get("/healthcheck", (req, res) => {
            res.end('ok');
        });

        v1Router.post("/test/:type", (req, res) => {
            let data;
            switch (req.params.type) {
                case "mail":
                    data = req.body;
                    this.emitter.emit('mailData', {
                        id: 4711,
                        sender: data.sender,
                        subject: data.subject,
                        content: data.content,
                        date: Date.now()
                    })

                    break;
                case "dme":
                    data = req.body;
                    this.emitter.emit('dmeData', {
                        content: data.content,
                    })
                    break;
            }

            res.status(200).send({status: "ok"});
        });

        this.app.listen(this.port, () => {
            console.log('API listening on port ' + this.apiPort);
        });

    }


}