import YAML from 'yaml';
import path from "path";
import fs from "fs";
import {ILogger} from "./logger.js";
import {config} from "./types/Config.js";

export default class configChecker {
    private configDir: string;
    private logger: ILogger;
    config: config;
    constructor(configDir: string, logger: ILogger) {
        this.configDir = configDir;
        this.logger = logger;

        let generalConfigFile = fs.readFileSync(path.join(this.configDir, 'general.yml'), 'utf-8');
        let mailConfigFile = fs.readFileSync(path.join(this.configDir, 'mail.yml'), 'utf-8');
        let serialDMEConfigFile = fs.readFileSync(path.join(this.configDir, 'serialDME.yml'), 'utf-8');
        let alarmTemplatesFile = fs.readFileSync(path.join(this.configDir, 'alarmTemplates.yml'), 'utf-8');

        this.config = {
            general: YAML.parse(generalConfigFile),
            mail: YAML.parse(mailConfigFile),
            serialDME: YAML.parse(serialDMEConfigFile),
            alarmTemplates: YAML.parse(alarmTemplatesFile)
        };

    }

    getYaml() {
        try {
            let generalConfigFile = fs.readFileSync(path.join(this.configDir, 'general.yml'), 'utf-8');
            this.config.general = YAML.parse(generalConfigFile);

            let mailConfigFile = fs.readFileSync(path.join(this.configDir, 'mail.yml'), 'utf-8');
            this.config.mail = YAML.parse(mailConfigFile);

            let serialDMEConfigFile = fs.readFileSync(path.join(this.configDir, 'serialDME.yml'), 'utf-8');
            this.config.serialDME = YAML.parse(serialDMEConfigFile);

            let alarmTemplatesFile = fs.readFileSync(path.join(this.configDir, 'alarmTemplates.yml'), 'utf-8');
            this.config.alarmTemplates = YAML.parse(alarmTemplatesFile);
        }
        catch (err: any) {
            this.logger.log('ERROR', 'Fehler beim Parsen der YAML-Dateien!');
            this.logger.log('ERROR', this.logger.convertObject(err));
        }
    }
}
