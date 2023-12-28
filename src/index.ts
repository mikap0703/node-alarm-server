import AlarmHandler from "./alarmHandler.js";
import { fileURLToPath } from "url";
import path from "path";
import ConfigChecker from "./config.js";
import Logger from "./logger.js";
import Backend from "./backend/server.js";
import { EventEmitter } from "node:events";

class AlarmServer {
  config: ConfigChecker;
  alarmhandler: AlarmHandler;
  private readonly logger: Logger;
  private readonly emitter: EventEmitter;
  private readonly dirname: string;

  constructor() {
    const filename = fileURLToPath(import.meta.url);
    this.dirname = path.join(path.dirname(filename), "..");

    this.logger = new Logger(this.dirname);

    // Ordner, in dem sich die config YAML Dateien befinden wird angegeben
    const configFolder = process.env.DEV_CONFIG_PATH ?? "./config";
    const configDir = path.join(this.dirname, configFolder);

    this.config = new ConfigChecker(configDir, this.logger);
    this.config.getYaml();

    this.emitter = new EventEmitter();

    this.alarmhandler = new AlarmHandler(
      this.config.config,
      this.logger,
      this.emitter,
      this.dirname,
    );
  }

  start(backendShouldStart: boolean = false): void {
    // Alarmhandler wird nach einem Timeout gestartet
    setTimeout(() => {
      this.alarmhandler.start();
    }, this.alarmhandler.timeout);

    if (backendShouldStart) {
      const backend = new Backend(
        this.dirname,
        8112,
        this.logger,
        this.emitter,
      );
      backend
        .start()
        .then(() => {
          this.logger.log("INFO", "Backend gestartet!");
        })
        .catch((err) => {
          this.logger.log(
            "ERROR",
            "Fehler beim Starten des Backends: " + err.message,
          );
        });
    }
  }
}

// Usage
const alarmServer = new AlarmServer();
alarmServer.start(true);
