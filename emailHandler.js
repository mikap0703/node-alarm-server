import Imap from "imap";
import {simpleParser} from "mailparser";
import {config} from "dotenv";
import {JSDOM} from "jsdom";
import AlarmBuilder from "./alarm.js";

config();

class MailHandler {
    constructor(mailConfig, alarmTemplates, logger, emitter) {
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

        this.maxAge = mailConfig.maxAge;
        this.alarmSender = mailConfig.alarmSender;
        this.alarmSubject = mailConfig.alarmSubject;
        this.alarmTemplateKeywords = mailConfig.alarmTemplateKeywords;
        this.alarmTemplates = alarmTemplates;
        this.alarmGroups = mailConfig.alarmGroups;
        this.alarmVehicles = mailConfig.alarmVehicles;
        this.alarmMembers = mailConfig.alarmMembers;
        this.stichwoerter = mailConfig.stichwoerter;

        switch (mailConfig.mailSchema) {
            case "SecurCad":
                this.mailParser = this.parseSecurCad;
                break;
        }
    }

    start() {
        this.connection.connect();
        this.connection.once('ready', () => {
            this.logger.log('INFO', 'IMAP Login erfolgreich!');
            this.openInbox();
        });

        this.connection.once('error', (err) => {
            this.logger.log('ERROR', `Connection error: ${this.logger.convertObject(err)}`);
            this.emitter.emit('restartMailHandler');
        });
    }

    openInbox() {
        this.connection.openBox('INBOX', true, (err, box) => {
            if (err) {
                this.logger.log('ERROR', err);
            }
            else if (process.env.DEV_MODE == 1) { // DEV
                this.logger.log('WARN', 'ACHTUNG - DEV-Modus aktiviert');
                let f = this.connection.seq.fetch((box.messages.total - 5) + ':*', { bodies: '', struct: true });

                this.logger.log('INFO', `Warten auf neue Mails von ${this.alarmSender} mit dem Betreff ${this.alarmSubject}`);

                f.on('message', (msg, seqno) => {
                    this.logger.log('INFO', '[MAIL] - ' + seqno);
                    msg.on('body', (stream) => {
                        let buffer = '';
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', () => {
                            this.evalMail(buffer, seqno);
                        });
                    });
                });

                f.once('error', (err) => {
                    this.logger.log('ERROR', err);
                });

            }

            else {
                this.logger.log('INFO', `Warten auf neue Mails von ${this.alarmSender} mit dem Betreff ${this.alarmSubject}`);

                this.connection.on('mail', () => {
                    this.logger.log('INFO', 'Neue Mail! Beginne mit Auswertung...');
                    let f = this.connection.seq.fetch(box.messages.total + ':*', { bodies: '', struct: true });

                    f.on('message', (msg, seqno) => {
                        this.logger.log('INFO', '[MAIL] - ' + seqno);
                        msg.on('body', (stream) => {
                            let buffer = '';
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', () => {
                                this.evalMail(buffer, seqno);
                            });
                        });
                    });

                    f.once('error', (err) => {
                        this.logger.log('ERROR', err);
                    });
                });
            }
        });
    }

    evalMail(mail, seqno) {
        simpleParser(mail)
            .then(parsed => {
                const {from, subject, text, html, date} = parsed;
                let fromAddr = from.value[0].address;
                let mailDate = new Date(date);

                if ((Date.now() - mailDate) / 1000 > this.maxAge) {
                    this.logger.log('INFO', `[#${seqno}] Mail zu alt (${mailDate.toLocaleDateString()}) - Alarm wird nicht ausgelöst`);
                }
                else {
                    if (fromAddr === this.alarmSender || this.alarmSender === '*') {
                        if (subject === this.alarmSubject || this.alarmSubject === '*') {
                            this.logger.log('INFO', `[#${seqno}] Absender (${fromAddr}) und Betreff (${subject}) stimmen überein - Mail #${seqno} wird ausgewertet!`)
                            this.emitter.emit('alarm', this.mailParser(seqno, text, html));
                        }
                        else {
                            this.logger.log('INFO', `[#${seqno}] Falscher Betreff (${subject}) - Alarm wird nicht ausgelöst`);
                        }
                    }
                    else {
                        this.logger.log('INFO', `[#${seqno}] Falscher Absender (${fromAddr}) - Alarm wird nicht ausgelöst`);
                    }
                }
            })
            .catch(err => {
                this.logger.log('ERROR', `[#${seqno}] Fehler beim Parsen:`);
                this.logger.log('ERROR', this.logger.convertObject(err));
            });
    }

    parseSecurCad(seqno, text, html) {
        const extractTableData = (htmlString) => {
            const dom = new JSDOM(htmlString);
            const tables = dom.window.document.getElementsByTagName("table");
            const result = {};

            for (let i = 0; i < tables.length; i++) {
                const table = tables[i];
                const rows = table.rows;

                for (let j = 0; j < rows.length; j++) {
                    const row = rows[j];
                    const rowData = [];

                    for (let k = 1; k < row.cells.length; k++) {
                        const cell = row.cells[k];
                        rowData.push(cell.innerHTML.replace(/(&\w+;)|([\r\n\t]+)/g, '').trim());
                    }

                    const key = row.cells[0].textContent.trim();
                    result[key] = rowData;
                }
            }
            return result;
        };

        const tableData = extractTableData(html + text);

        let alarm = new AlarmBuilder(this.logger);
        alarm.applyTemplate(this.alarmTemplates['default']);

        // Einsatznummer - ID
        let einsatznummer = tableData['Einsatznummer:']?.[0] || '';
        alarm.data.id = einsatznummer.toString();

        // Stichwort, Text und Einsatzobjekt
        let stichwort = tableData['Einsatzstichwort:']?.[0] || '';
        stichwort = this.stichwoerter[stichwort.toUpperCase()] || stichwort;
        let sachverhalt = tableData['Sachverhalt:']?.[0] || '';
        let notfallgeschehen = tableData['Notfallgeschehen:']?.[0] || '';

        let objekt = tableData['Objekt:']?.[0] || '';
        alarm.data.address.object = objekt;

        if (notfallgeschehen !== '') {
            try {
                alarm.data.title = notfallgeschehen.match(/\((.*?)\)/)[1];
            } catch {
                alarm.data.title = notfallgeschehen;
            }
        } else {
            if (stichwort) alarm.data.title = stichwort;
        }

        alarm.data.text = sachverhalt ? (objekt ? sachverhalt + ' - ' + objekt : sachverhalt) : objekt;

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