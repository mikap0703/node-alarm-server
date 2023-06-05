import path from "path";
import { handler } from "./client/build/handler.js"
import fs from "fs";
import express, { Router } from "express";
import bodyParser from "body-parser";

export default class WebUI{
    constructor(dirname, webUIPort, apiPort, logger, emitter) {
        this.dirname = dirname;
        this.webUIPort = webUIPort;
        this.apiPort = apiPort;
        this.logger = logger;
        this.emitter = emitter;

        this.web = express();
        // let SvelteKit handle everything else, including serving prerendered pages and static assets
        this.web.use(handler);

        this.api = express();
        this.api.use(bodyParser.json());

    }

    start(){
        // WebUI
        this.web.listen(this.webUIPort, () => {
            console.log('WebUI listening on port ' + this.webUIPort);
        });

        // API - routes that live separately from the SvelteKit app

        this.api.listen(this.apiPort, () => {
            console.log('API listening on port ' + this.apiPort);
        });

        const v1Router = Router();
        this.api.use("/api/v1", v1Router);

        v1Router.get("/healthcheck", (req, res) => {
            res.end('ok');
        });

        v1Router.post("/test/:type", (req, res) => {
            switch (req.params.type) {
                case "mail":
                    let data = req.body;
                    this.emitter.emit('mailData', {
                        id: 4711,
                        sender: data.sender,
                        subject: data.subject,
                        content: data.content,
                        date: Date.now()
                    })
                    break;
            }

            res.send(req.body)
        });

    }


}