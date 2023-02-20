const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;

require('dotenv').config();
class MailHandler {
    constructor(triggerAlarm, logger) {
        this.connection = new Imap({
            user: process.env.MAIL_USER,
            password: process.env.MAIL_PASSWORD,
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            tls: process.env.MAIL_TLS,
            keepalive: {
                    interval: 3000,
                    idleInterval: 3000,
                    forceNoop: true
            }
        });
        this.triggerAlarm = triggerAlarm;
        this.logger = logger;
    }

    startConnection() {
        this.connection.connect();
        this.connection.once('ready', () => {
            console.log("Login erfolgreich!");
            this.openInbox();
        });

        this.connection.once('error', (err) => {
            console.log('Connection error:', err);
        });
    }

    openInbox() {
        this.connection.openBox('INBOX', true, (err, box) => {
            if (err) {
                console.log('[ERROR] - #%d', err)
            }
            else {
                console.log("Warten auf neue Mails...");
                this.connection.on('mail', (numNewMsgs) => {
                    console.log('Neue Mail! Beginne mit Auswertung...');
                    var f = this.connection.seq.fetch(box.messages.total + ':*', { bodies: '' });
                    f.on('message', (msg, seqno) => {
                        console.log('[MAIL] - ' + seqno);
                        msg.on('body', (stream, info) => {
                            this.evalMail(stream, seqno)
                        });
                    });

                    f.once('error', (err) => {
                        console.log('[ERROR] - #%d', err)
                    })
                });
            }
        });
    }

    evalMail(mailStream, seqno) {
        simpleParser(mailStream, async (err, parsed) => {
            const {from, subject, text} = parsed;
            let fromAddr = from.value[0].address;
            if (fromAddr == process.env.ALARM_RECEIVER) {
                if (subject == process.env.ALARM_SUBJECT) {
                    console.log(`[#${seqno}] Absender (${fromAddr}) und Betreff (${subject}) stimmen überein - Mail #${seqno} wird ausgewertet!`)
                    this.triggerAlarm(this.parseHTML(seqno, text));
                }
                else {
                    console.log(`[#${seqno}] Falscher Betreff (${subject}) - Alarm wird nicht ausgelöst`);
                }
            }
            else {
                console.log(`[#${seqno}] Falscher Absender (${fromAddr}) - Alarm wird nicht ausgelöst`);
            }
        });
    }

    parseHTML(seqno, body) {
        let payload = {
            title: process.env.ALARM_DEFAULT_TITLE,
            address: ""
        }

        let lines = body.split(/[\r\n\t]+/g);
        let cleanedLines = [];
        for (let line of lines) {
            line = line.trim();
            if (line.length > 0) {
                cleanedLines.push(line)
            }
        }

        for (let [i, v] of cleanedLines.entries()) {
            let valueNext = cleanedLines[i + 1]
            switch (v) {
                case 'Einsatzstichwort:':
                    payload['title'] = valueNext;
                    break;

                case 'Sachverhalt:':
                case 'Notfallgeschehen:':
                    payload['text'] = valueNext;
                    break;

                case 'FL SU 1':
                case 'FL SU 1/31-1':
                case 'FL SU 3':

                case 'Strasse / Hs.-Nr.:':
                    payload['address'] = valueNext + ' ' + payload['address'];
                    break;

                case 'PLZ / Ort:':
                    payload['address'] = payload['address'] + valueNext;
                    break;
            }
        }
        return payload
    }
}

module.exports = MailHandler;
