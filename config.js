import * as yup from 'yup';
import {fileURLToPath} from "url";
import path from "path";
import fs from "fs";

import {config} from "dotenv";
config();

export default class configChecker {
    constructor(configDir) {
        this.configDir = configDir

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
        })

        this.serialDMEConfigSchema = yup.object({
            comPort: yup.string().required(),
            rics: yup.array()
        })
    }

    async getConfigs() {
        const mailConfig = JSON.parse(fs.readFileSync(path.join(this.configDir, 'mail.json')))
        this.mail = await this.mailConfigSchema.validate(mailConfig)

        const serialDmeConfig = JSON.parse(fs.readFileSync(path.join(this.configDir, 'serial-dme.json')))
        this.serialDME = await this.serialDMEConfigSchema.validate(serialDmeConfig)

        const generalConfig = JSON.parse(fs.readFileSync(path.join(this.configDir, 'general.json')))
        this.general = await this.generalConfigSchema.validate(generalConfig)
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configFolder = process.env.DEV_CONFIG_PATH || './config';
const configDir = path.join(__dirname, configFolder);

let checker = await new configChecker(configDir)
await checker.getConfigs()

console.log(checker.mail)