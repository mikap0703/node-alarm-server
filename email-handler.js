import Imap from "imap";
import {simpleParser} from "mailparser";
import {config} from "dotenv";

config();

class MailHandler {
    constructor(triggerAlarm, mailConfig, logger) {
        this.connection = new Imap({
            user: mailConfig.user,
            password: mailConfig.password,
            host: mailConfig.host,
            port:mailConfig.port,
            tls: mailConfig.tls,
            keepalive: {
                    interval: 3000,
                    idleInterval: 3000,
                    forceNoop: true
            }
        });
        this.alarmSender = mailConfig.alarmSender
        this.alarmSubject = mailConfig.alarmSubject
        this.alarmGroups = mailConfig.alarmGroups
        switch (mailConfig.mailSchema) {
            case "SecurCad":
                this.mailParser = this.parseSecurCad
                break;
        }
        this.triggerAlarm = triggerAlarm;
        this.logger = logger;
    }

    startConnection() {
        this.connection.connect();
        this.connection.once('ready', () => {
            this.logger.log('INFO', 'IMAP Login erfolgreich!');
            this.openInbox();
        });

        this.connection.once('error', (err) => {
            this.logger.log('ERROR', 'Connection error:', err);
        });
    }

    openInbox() {
        this.connection.openBox('INBOX', true, (err, box) => {
            if (err) {
                this.logger.log('ERROR', err)
            }
            else {
                this.logger.log('INFO', `Warten auf neue Mails von ${this.alarmSender} mit dem Betreff ${this.alarmSubject}`)
                this.connection.on('mail', () => {
                    this.logger.log('INFO', 'Neue Mail! Beginne mit Auswertung...');
                    var f = this.connection.seq.fetch(box.messages.total + ':*', { bodies: '' });
                    f.on('message', (msg, seqno) => {
                        this.logger.log('INFO', '[MAIL] - ' + seqno);
                        msg.on('body', (stream) => {
                            this.evalMail(stream, seqno)
                        });
                    });

                    f.once('error', (err) => {
                        this.logger.log('ERROR', err)
                    })
                });
            }
        });
    }

    evalMail(mailStream, seqno) {
        simpleParser(mailStream, async (err, parsed) => {
            const {from, subject, text} = parsed;
            let fromAddr = from.value[0].address;
            if (fromAddr == this.alarmSender || this.alarmSender == '*') {
                if (subject == this.alarmSubject || this.alarmSubject == '*') {
                    this.logger.log('INFO', `[#${seqno}] Absender (${fromAddr}) und Betreff (${subject}) stimmen überein - Mail #${seqno} wird ausgewertet!`)
                    this.triggerAlarm(this.mailParser(seqno, text));
                }
                else {
                    this.logger.log('INFO', `[#${seqno}] Falscher Betreff (${subject}) - Alarm wird nicht ausgelöst`);
                }
            }
            else {
                this.logger.log('INFO', `[#${seqno}] Falscher Absender (${fromAddr}) - Alarm wird nicht ausgelöst`);
            }
        });
    }

    parseSecurCad(seqno, body) {
        let getNext = (a, i) => {
            let index = a.indexOf(i);
            if (index == -1) {
                return ""
            } else {
                return a[index + 1]
            }
        }

        let lines = body.split(/[\r\n\t]+/g);
        let cleanedLines = [];
        for (let line of lines) {
            line = line.trim();
            if (line.length > 0) {
                cleanedLines.push(line)
            }
        }

        let payload = {}

        let stichwort = getNext(cleanedLines, 'Einsatzstichwort:')
        let sachverhalt = getNext(cleanedLines, 'Sachverhalt:')
        let notfallgeschehen = getNext(cleanedLines, 'Notfallgeschehen:')
        let strasse = getNext(cleanedLines, 'Strasse / Hs.-Nr.:')
        let ort = getNext(cleanedLines, 'PLZ / Ort:')
        let objekt = getNext(cleanedLines, "Objekt:")

        /*
        payload["groups"] = []

        for (let g in this.alarmGroups) {
            let groupIndex = cleanedLines.indexOf(g)
            if (groupIndex != -1) {
                let v = this.alarmGroups[g]
                if (v != "") {
                    payload["groups"].push(v)
                }
            }
        }
        */

        if (notfallgeschehen != '') {
            try {
                payload['title'] = notfallgeschehen.match(/\((.*?)\)/)[1]
            } catch {
                payload['title'] = notfallgeschehen
            }
        } else {
            if (stichwort != '') payload['title'] = stichwort
        }



        payload['text'] = sachverhalt ? (objekt ? sachverhalt + ' - ' + objekt : sachverhalt) : objekt


        if (strasse != '') {
            if (ort != '') {
                payload['address'] = strasse + ', ' + ort;
            } else {
                payload['address'] = strasse
            }
        } else {
            payload['address'] = ort
        }

        this.logger.log('INFO', this.logger.convertObject(payload))
        return payload
    }
}

export default MailHandler