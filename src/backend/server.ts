import express, {
  Router,
  Application,
  Request,
  Response,
  NextFunction,
} from "express";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";
import { type ILogger } from "../logger.js";
import { type EventEmitter } from "node:events";

const preSharedSecret: string | undefined = process.env.API_ADMIN_SECRET;

export default class Backend {
  private readonly port: number;
  private readonly logger: ILogger;
  private readonly emitter: EventEmitter;
  private readonly app: any;
  private readonly v1Router: Router;
  private readonly authenticate: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => any;

  constructor(
    dirname: string,
    port: number,
    logger: ILogger,
    emitter: EventEmitter,
  ) {
    this.port = port;
    this.logger = logger;
    this.emitter = emitter;

    this.app = express();

    this.v1Router = Router();

    this.app.use(cors());
    this.app.use(bodyParser.json());

    this.authenticate = (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization;

      if (token == null) {
        return res.status(401).send({ err: "Nicht authorisiert!" });
      }
      if (token === preSharedSecret && token !== "") {
        next();
      }
    };

    this.app.use("/api/v1", this.v1Router);
  }

  async start(): Promise<void> {
    // await this.userDB.read();
    // API
    this.v1Router.get("/healthcheck", (req, res) => {
      res.end("ok");
    });

    this.v1Router.post("/auth/login", (req, res) => {
      const data = req.body;

      if (data.preSharedSecret === preSharedSecret) {
        res.status(200).send({ msg: "Erfolgreich angemeldet!" });
      } else {
        res.status(401).send({ msg: "Falsches Passwort!" });
      }
    });

    this.v1Router.post(
      "/test/:type",
      this.authenticate,
      (req: Request, res: Response) => {
        const data = req.body;

        switch (req.params.type) {
          case "mail":
            this.emitter.emit("mailData", {
              id: 4711,
              sender: data.sender,
              subject: data.subject,
              content: data.content,
              date: Date.now(),
            });

            break;
          case "dme":
            this.emitter.emit("dmeData", {
              content: data.content,
            });

            break;
        }

        res.status(200).send({ status: "ok" });
      },
    );

    this.v1Router.post("/settings", this.authenticate, () => {});

    this.app.listen(this.port, () => {
      this.logger.log("INFO", "API listening on port " + this.port);
    });
  }
}
