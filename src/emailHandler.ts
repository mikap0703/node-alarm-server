import Imap, {Box, ImapMessage} from "imap";
import {simpleParser, Source} from "mailparser";
import {config} from "dotenv";
import {JSDOM} from "jsdom";
import AlarmFactory from "./alarmFactory.js";
import {mailConfig} from "./types/Config.js";
import {Alarm} from "./types/Alarm.js";
import {ILogger} from "./logger.js";
import {EventEmitter} from "node:events";

config();

class MailHandler {
    private readonly logger: ILogger;
    private readonly emitter: EventEmitter;
    private connection: any;
    private readonly maxAge: number;
    private readonly alarmSender: string;
    private readonly alarmSubject: string;
    private readonly alarmTemplateKeywords: Record<string, string>;
    private readonly alarmTemplates: Record<string, Alarm>;
    private readonly stichwoerter: Record<string, string>;
    private readonly mailParser: (seqno: number, content: string) => AlarmFactory;

    constructor(mailConfig: mailConfig, alarmTemplates: Record<string, Alarm>, logger: ILogger, emitter: EventEmitter) {
        this.logger = logger;
        this.emitter = emitter;

        this.connection = new Imap({
            user: mailConfig.user,
            password: mailConfig.password,
            host: mailConfig.host,
            port:mailConfig.port,
            tls: mailConfig.tls,
            keepalive: {
                    interval: 2000,
                    idleInterval: 2000,
                    forceNoop: true
            }
        });

        const defaultMailParser = (id: number, content: string): AlarmFactory => {
            this.logger.log("WARN", "Kein Mail-Parser definiert!");
            return new AlarmFactory(this.logger);
        }

        this.maxAge = mailConfig.maxAge;
        this.alarmSender = mailConfig.alarmSender;
        this.alarmSubject = mailConfig.alarmSubject;
        this.alarmTemplateKeywords = mailConfig.alarmTemplateKeywords;
        this.alarmTemplates = alarmTemplates;
        this.stichwoerter = mailConfig.stichwoerter;

        this.mailParser = defaultMailParser;

        switch (mailConfig.mailSchema) {
            case "SecurCad":
                this.mailParser = this.parseSecurCad;
                break;
        }
    }

    start() {
        this.connection.connect();
        this.connection.once('ready', () => {
            this.logger.log('INFO', 'IMAP login erfolgreich!');
            this.openInbox();
        });

        this.connection.once('error', (err: any) => {
            this.logger.log('ERROR', `Connection error: ${this.logger.convertObject(err)}`);
            this.emitter.emit('restartMailHandler');
        });
    }

    fetchnMails(n: number) {
        this.connection.openBox('INBOX', true, (err: any, box: Box) => {
            if (err) {
                this.logger.log('ERROR', this.logger.convertObject(err));
            }
            else {
                n -= 1;
                let f = this.connection.seq.fetch((box.messages.total - n) + ':*', { bodies: '', struct: true });

                f.on('message', (msg: ImapMessage, seqno: number) => {
                    this.logger.log('INFO', '[MAIL] - ' + seqno);
                    msg.on('body', (stream) => {
                        let buffer = '';
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString();
                        });
                        stream.once('end', () => {
                            this.evalMail(buffer, seqno);
                        });
                    });
                });

                f.once('error', (err: any) => {
                    this.logger.log('ERROR', this.logger.convertObject(err));
                });
            }
        });
    }

    openInbox() {
        this.connection.openBox('INBOX', true, (err: any) => {
            if (err) {
                this.logger.log('ERROR', this.logger.convertObject(err));
            }
            else {
                this.logger.log('INFO', `Warten auf neue Mails von ${this.alarmSender} mit dem Betreff ${this.alarmSubject}`);

                this.connection.on('mail', () => {
                    this.logger.log('INFO', 'Neue Mail! Beginne mit Auswertung...');
                    this.fetchnMails(1);
                });
            }
        });
    }

    evalMail(mail: Source, seqno: number) {
        simpleParser(mail)
            .then(parsed => {
                let {from, subject, text, html, date} = parsed;

                let fromAddr: string | undefined;
                let mailDate: number | undefined = 0;

                if (from) {
                    fromAddr = from.value[0].address;
                }
                else {
                    fromAddr = "";
                }

                if (!text) {
                    text = "";
                }

                if (date) {
                    mailDate = new Date(date).getDate();
                }

                this.handleMailData(seqno, <string>fromAddr, <string>subject, html + text, mailDate);
            })
            .catch(err => {
                this.logger.log('ERROR', `[#${seqno}] Fehler beim Parsen:`);
                this.logger.log('ERROR', this.logger.convertObject(err));
            });
    }

    handleMailData(id: number, sender: string, subject: string, content: string, date: number) {
        if ((Date.now() - date) / 1000 > this.maxAge) {
            this.logger.log('INFO', `[#${id}] Mail zu alt (${new Date(date).toLocaleDateString()}) - Alarm wird nicht ausgelöst`);
        }
        else {
            if (sender === this.alarmSender || this.alarmSender === '*') {
                if (subject === this.alarmSubject || this.alarmSubject === '*') {
                    this.logger.log('INFO', `[#${id}] Absender (${sender}) und Betreff (${subject}) stimmen überein - Mail #${id} wird ausgewertet!`)
                    let alarm = this.mailParser(id, content)
                    console.log(content);
                    alarm.mailData({
                        id: id.toString(), sender, subject, content, date
                    });
                    this.emitter.emit('alarm', alarm);
                }
                else {
                    this.logger.log('INFO', `[#${id}] Falscher Betreff (${subject}) - Alarm wird nicht ausgelöst`);
                }
            }
            else {
                this.logger.log('INFO', `[#${id}] Falscher Absender (${sender}) - Alarm wird nicht ausgelöst`);
            }
        }
    }

    extractTableData (html: string): Record<string, string[]> {
        const dom: JSDOM = new JSDOM(html);
        const tables = dom.window.document.getElementsByTagName("table");
        const result: Record<string, string[]> = {};

        for (let i: number = 0; i < tables.length; i++) {
            const table: HTMLTableElement = tables[i];
            const rows: HTMLCollectionOf<HTMLTableRowElement> = table.rows;

            for (let j = 0; j < rows.length; j++) {
                const row: HTMLTableRowElement = rows[j];
                const rowData: string[] = [];

                for (let k: number = 1; k < row.cells.length; k++) {
                    const cell: HTMLTableCellElement = row.cells[k];
                    rowData.push(cell.innerHTML.replace(/(&\w+;)|([\r\n\t]+)/g, '').trim());
                }

                const key: string | null = row.cells[0].textContent;
                if (key) {
                    result[key.trim()] = rowData;
                }
            }
        }
        return result;
    }

    parseSecurCad(seqno: number, content: string): AlarmFactory {
        const tableData = this.extractTableData(content);

        let alarm = new AlarmFactory(this.logger);
        alarm.origin("mail");
        alarm.applyTemplate(this.alarmTemplates['default']);

        // Einsatznummer - ID
        let einsatznummer: string = tableData['Einsatznummer:']?.[0] || '';
        alarm.id(einsatznummer.toString());

        // Stichwort, Text und Einsatzobjekt
        let stichwort: string = tableData['Einsatzstichwort:']?.[0] || '';
        stichwort = this.stichwoerter[stichwort.toUpperCase()] || stichwort;
        let sachverhalt: string = tableData['Sachverhalt:']?.[0] || '';
        let notfallgeschehen: string = tableData['Notfallgeschehen:']?.[0] || '';

        let objekt = tableData['Objekt:']?.[0] || '';
        alarm.data.address.object = objekt;

        if (notfallgeschehen) {
            const matchResult = notfallgeschehen.match(/\((.*?)\)/);
            if (matchResult) {
                alarm.title(matchResult[1] || notfallgeschehen || "");
            } else {
                alarm.title(notfallgeschehen || "");
            }
        } else if (stichwort) {
            alarm.title(stichwort);
        }


        alarm.text(sachverhalt ? (objekt ? sachverhalt + ' - ' + objekt : sachverhalt) : objekt);

        // Adresse
        alarm.data.address.street = tableData['Strasse / Hs.-Nr.:']?.[0] || '';
        if (alarm.data.address.street === '') {
            alarm.data.address.street = tableData['Strasse:']?.[0] || '';
        }
        alarm.data.address.city = tableData['PLZ / Ort:']?.[0] || '';
        alarm.data.address.info = tableData['Info:']?.[0] || '';

        // Einsatzvorlagen anwenden - Empfängergruppen und alarmierte Fahrzeuge
        for (let keyword in this.alarmTemplateKeywords) {
            if (tableData[keyword]) {
                // Keyword existiert in Alarm Mail
                let template = this.alarmTemplateKeywords[keyword];
                alarm.applyTemplate(this.alarmTemplates[template]);
            }
        }
        return alarm;
    }
}

export default MailHandler