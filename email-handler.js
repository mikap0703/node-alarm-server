import Imap from "imap";
import {simpleParser, MailParser} from "mailparser";
import {config} from "dotenv";
import {JSDOM} from "jsdom";

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
                    interval: 2000,
                    idleInterval: 2000,
                    forceNoop: true
            }
        });
        this.alarmSender = mailConfig.alarmSender
        this.alarmSubject = mailConfig.alarmSubject
        this.alarmGroups = mailConfig.alarmGroups
        this.alarmVehicles = mailConfig.alarmVehicles
        this.alarmMembers = mailConfig.alarmMembers

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
            else if (process.env.DEV_MODE == 1) { // DEV
                this.logger.log('WARN', 'ACHTUNG - DEV-Modus aktiviert')
                var f = this.connection.seq.fetch('370:*', {
                    bodies: '',
                    struct: true
                })

                this.logger.log('INFO', `Warten auf neue Mails von ${this.alarmSender} mit dem Betreff ${this.alarmSubject}`)

                f.on('message', (msg, seqno) => {
                    this.logger.log('INFO', '[MAIL] - ' + seqno);
                    msg.on('body', (stream) => {
                        var buffer = '';
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', () => {
                            this.evalMail(buffer, seqno)
                        });
                    });

                    msg.once('attributes', function (attrs) {
                        // console.log('Attributes: %s', inspect(attrs, false, 8));
                    });
                });

            }

            else {
                this.logger.log('INFO', `Warten auf neue Mails von ${this.alarmSender} mit dem Betreff ${this.alarmSubject}`)

                this.connection.on('mail', () => {
                    this.logger.log('INFO', 'Neue Mail! Beginne mit Auswertung...');
                    var f = this.connection.seq.fetch(box.messages.total + ':*', { bodies: '', struct: true });

                    f.on('message', (msg, seqno) => {
                        this.logger.log('INFO', '[MAIL] - ' + seqno);
                        msg.on('body', (stream) => {
                            var buffer = '';
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', () => {
                                this.evalMail(buffer, seqno)
                            });
                        });
                    });

                    f.once('error', (err) => {
                        this.logger.log('ERROR', err)
                    })
                });
            }
        });
    }

    evalMail(mail, seqno) {
        simpleParser(mail)
            .then(parsed => {
                const {from, subject, text, html} = parsed;
                let fromAddr = from.value[0].address;
                if (fromAddr == this.alarmSender || this.alarmSender == '*') {
                    if (subject == this.alarmSubject || this.alarmSubject == '*') {
                        this.logger.log('INFO', `[#${seqno}] Absender (${fromAddr}) und Betreff (${subject}) stimmen ??berein - Mail #${seqno} wird ausgewertet!`)
                        this.triggerAlarm(this.mailParser(seqno, text, html));
                    }
                    else {
                        this.logger.log('INFO', `[#${seqno}] Falscher Betreff (${subject}) - Alarm wird nicht ausgel??st`);
                    }
                }
                else {
                    this.logger.log('INFO', `[#${seqno}] Falscher Absender (${fromAddr}) - Alarm wird nicht ausgel??st`);
                }
            })
            .catch(err => {
                this.logger.log('ERROR', `[#${seqno}] Fehler beim Parsen:`);
                this.logger.log('ERROR', this.logger.convertObject(err))
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

        const tableData = extractTableData(html)

        let payload = {
            "id": "",
            "title": "",
            "text": "",
            "address": {
                "street": "",
                "city": "",
                "object": ""
            },
            "groups": [],
            "vehicles": [],
            "members": []
        }

        // Einsatznummer - ID
        let einsatznummer = tableData['Einsatznummer:']?.[0] || ''
        payload['id'] = einsatznummer.toString()

        // Stichwort, Text und Einsatzobjekt
        let stichwort = tableData['Einsatzstichwort:']?.[0] || ''
        let sachverhalt = tableData['Sachverhalt:']?.[0] || ''
        let notfallgeschehen = tableData['Notfallgeschehen:']?.[0] || ''

        let objekt = tableData['Objekt:']?.[0] || ''
        payload.address.object = objekt

        if (notfallgeschehen != '') {
            try {
                payload['title'] = notfallgeschehen.match(/\((.*?)\)/)[1]
            } catch {
                payload['title'] = notfallgeschehen
            }
        } else {
            if (stichwort) payload['title'] = stichwort
        }

        payload['text'] = sachverhalt ? (objekt ? sachverhalt + ' - ' + objekt : sachverhalt) : objekt

        // Adresse
        payload.address.street = tableData['Strasse / Hs.-Nr.:']?.[0] || ''
        if (payload.address.street == '') {
            payload.address.street = tableData['Strasse:']?.[0] || ''
        }
        payload.address.city = tableData['PLZ / Ort:']?.[0] || ''

        // Empf??ngergruppen und alarmierte Fahrzeuge

        const addToPayload = (property, payloadProperty) => {
            for (let g in this[property]) {
                if (tableData[g]) {
                    let v = this[property][g];
                    if (Array.isArray(v)) {
                        payload[payloadProperty].push(...v);
                    } else {
                        payload[payloadProperty].push(v);
                    }
                }
            }
        }

        addToPayload("alarmGroups", "groups");
        addToPayload("alarmVehicles", "vehicles");
        addToPayload("alarmMembers", "members");

        this.logger.log('INFO', this.logger.convertObject(payload))
        return payload
    }
}

export default MailHandler