import * as yup from 'yup';
import YAML from 'yaml';
import path from "path";
import fs from "fs";

export default class configChecker {
    constructor(configDir, logger) {
        this.configDir = configDir;
        this.logger = logger;
        this.config = {}
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
        catch (err) {
            this.logger.log('ERROR', 'Fehler beim Parsen der YAML-Dateien!');
            this.logger.log('ERROR', err);
        }


    }
}
