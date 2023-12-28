import YAML from "yaml";
import path from "path";
import fs from "fs";
import { type ILogger } from "./logger.js";
import { type config } from "./types/Config.js";

export default class ConfigChecker {
  config: config;
  private readonly configDir: string;
  private readonly logger: ILogger;

  constructor(configDir: string, logger: ILogger) {
    this.configDir = configDir;
    this.logger = logger;

    const generalConfigFile = fs.readFileSync(
      path.join(this.configDir, "general.yml"),
      "utf-8",
    );
    const mailConfigFile = fs.readFileSync(
      path.join(this.configDir, "mail.yml"),
      "utf-8",
    );
    const serialDMEConfigFile = fs.readFileSync(
      path.join(this.configDir, "serialDME.yml"),
      "utf-8",
    );
    const alarmTemplatesFile = fs.readFileSync(
      path.join(this.configDir, "alarmTemplates.yml"),
      "utf-8",
    );

    this.config = {
      general: YAML.parse(generalConfigFile),
      mail: YAML.parse(mailConfigFile),
      serialDME: YAML.parse(serialDMEConfigFile),
      alarmTemplates: YAML.parse(alarmTemplatesFile),
    };
  }

  getYaml(): boolean {
    try {
      const generalConfigFile = fs.readFileSync(
        path.join(this.configDir, "general.yml"),
        "utf-8",
      );
      this.config.general = YAML.parse(generalConfigFile);

      const mailConfigFile = fs.readFileSync(
        path.join(this.configDir, "mail.yml"),
        "utf-8",
      );
      this.config.mail = YAML.parse(mailConfigFile);

      const serialDMEConfigFile = fs.readFileSync(
        path.join(this.configDir, "serialDME.yml"),
        "utf-8",
      );
      this.config.serialDME = YAML.parse(serialDMEConfigFile);

      const alarmTemplatesFile = fs.readFileSync(
        path.join(this.configDir, "alarmTemplates.yml"),
        "utf-8",
      );
      this.config.alarmTemplates = YAML.parse(alarmTemplatesFile);

      return true;
    } catch (err: any) {
      this.logger.log("ERROR", "Fehler beim Parsen der YAML-Dateien!");
      this.logger.log("ERROR", this.logger.convertObject(err));

      return false;
    }
  }
}
