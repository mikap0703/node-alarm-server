import * as yup from 'yup';
import {fileURLToPath} from "url";
import path from "path";
import fs from "fs";

import {config} from "dotenv";
config();

export default class configChecker {
    constructor() {
        this.configDir = "";
        this.config = {}

        this.generalConfigSchema = yup.object({
            api: yup.string().required().oneOf(['Divera', 'Alamos']),
            apiKey: yup.string().required(),
            serialDME: yup.boolean().required(),
            mail: yup.boolean().required(),
            alarm: yup.boolean().required(),
        });

        this.mailConfigSchema = yup.object({
            user: yup.string().required().email().trim().lowercase(),
            password: yup.string().required()
        });

        this.serialDMEConfigSchema = yup.object({
            port: yup.string().required(),
            rics: yup.array()
        });
    }

    async check(configDir) {
        const mailConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'mail.json')));
        this.config.mail = await this.mailConfigSchema.validate(mailConfig);

        const serialDmeConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'serial-dme.json')));
        this.config.serialDME = await this.serialDMEConfigSchema.validate(serialDmeConfig);

        const generalConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'general.json')));
        this.config.general = await this.generalConfigSchema.validate(generalConfig);

        const alarmTemplatesConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'alarmTemplates.json')));
        this.config.alarmTemplates = alarmTemplatesConfig; // TODO: Validation
    }
}
