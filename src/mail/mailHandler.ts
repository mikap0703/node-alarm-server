import Imap, { type Box, type ImapMessage } from 'node-imap'
import { simpleParser, type Source } from 'mailparser'
import { config } from 'dotenv'
import AlarmFactory from '../alarmFactory.js'
import { type mailConfig } from '../types/Config.js'
import { type Alarm } from '../types/Alarm.js'
import { type ILogger } from '../logger.js'
import { type EventEmitter } from 'node:events'
import { securCADParser } from './parser/securCAD.js'

config()

class MailHandler {
  private readonly logger: ILogger
  private readonly emitter: EventEmitter
  private readonly connection: Imap
  private readonly maxAge: number
  private readonly alarmSender: string
  private readonly alarmSubject: string
  private readonly alarmTemplates: Record<string, Alarm>
  private readonly mailSchema: string
  private readonly config: mailConfig

  constructor (
    mailConfig: mailConfig,
    alarmTemplates: Record<string, Alarm>,
    logger: ILogger,
    emitter: EventEmitter
  ) {
    this.logger = logger
    this.emitter = emitter

    this.connection = new Imap({
      user: mailConfig.user,
      password: mailConfig.password,
      host: mailConfig.host,
      port: mailConfig.port,
      tls: mailConfig.tls,
      keepalive: {
        interval: 2000,
        idleInterval: 2000,
        forceNoop: true
      }
    })

    this.config = mailConfig
    this.maxAge = mailConfig.maxAge
    this.alarmSender = mailConfig.alarmSender
    this.alarmSubject = mailConfig.alarmSubject
    this.alarmTemplates = alarmTemplates
    this.mailSchema = mailConfig.mailSchema
  }

  start (): void {
    this.connection.connect()
    this.connection.once('ready', () => {
      this.logger.log('INFO', 'IMAP login erfolgreich!')
      this.openInbox()
    })

    this.connection.once('error', (err: any) => {
      this.logger.log('ERROR', 'Connection Error')
      this.handleError(err)
    })
  }

  openInbox (): void {
    this.connection.openBox('INBOX', true, (err: any) => {
      if (err !== undefined && err !== null) {
        this.logger.log('ERROR', this.logger.convertObject(err))
        return
      }

      this.logger.log(
        'INFO',
        `Warten auf neue Mails von ${this.alarmSender} mit dem Betreff ${this.alarmSubject}`
      )

      this.connection.on('mail', () => {
        this.logger.log('INFO', 'Neue Mail! Beginne mit Auswertung...')
        this.fetchnMails(1)
      })
    })
  }

  fetchnMails (n: number): void {
    this.connection.openBox('INBOX', true, (err: any, box: Box) => {
      if (err !== undefined && err !== null) {
        this.logger.log('ERROR', this.logger.convertObject(err))
      } else {
        n -= 1
        const f = this.connection.seq.fetch(box.messages.total - n + ':*', {
          bodies: '',
          struct: true
        })

        f.on('message', (msg: ImapMessage, seqno: number) => {
          this.logger.log('INFO', '[MAIL] - ' + seqno)
          msg.on('body', (stream) => {
            let buffer = ''
            stream.on('data', (chunk) => {
              buffer += chunk.toString()
            })
            stream.once('end', () => {
              this.evalMail(buffer, seqno)
            })
          })
        })

        f.on('error', (err: any) => {
          this.logger.log('ERROR', this.logger.convertObject(err))
        })
      }
    })
  }

  evalMail (mail: Source, seqno: number): void {
    simpleParser(mail)
      .then((parsed) => {
        const { from, subject, text, html, date } = parsed
        const mailSubject = subject ?? ''
        const fromAddr = from?.value[0].address ?? ''
        const mailDate = new Date(date ?? 0).getTime()
        const content = html + (text ?? '') // Combine HTML and text content

        this.handleMailData(seqno, fromAddr, mailSubject, content, mailDate)
      })
      .catch((err) => {
        this.logger.log('ERROR', `[#${seqno}] Fehler beim Parsen:`)
        this.logger.log('ERROR', this.logger.convertObject(err))
      })
  }

  handleMailData (
    id: number,
    sender: string,
    subject: string,
    content: string,
    date: number
  ): boolean {
    const currentTime = Date.now()
    const isTooOld = (currentTime - date) / 1000 > this.maxAge

    if (isTooOld) {
      this.logger.log(
        'INFO',
        `[#${id}] Mail zu alt (${new Date(
          date
        ).toLocaleDateString()}) - Alarm wird nicht ausgelöst`
      )

      return false
    } else {
      const isMatchingSender =
        sender === this.alarmSender || this.alarmSender === '*'
      const isMatchingSubject =
        subject === this.alarmSubject || this.alarmSubject === '*'

      if (isMatchingSender && isMatchingSubject) {
        this.logger.log(
          'INFO',
          `[#${id}] Absender (${sender}) und Betreff (${subject}) stimmen überein - Mail #${id} wird ausgewertet!`
        )
        const alarm = this.mailParser(id, content)
        alarm.mailData({
          id: id.toString(),
          sender,
          subject,
          content,
          date
        })

        this.emitter.emit('alarm', alarm)
        return true
      } else if (!isMatchingSender) {
        this.logger.log(
          'INFO',
          `[#${id}] Falscher Absender (${sender}) - Alarm wird nicht ausgelöst`
        )

        return false
      } else {
        this.logger.log(
          'INFO',
          `[#${id}] Falscher Betreff (${subject}) - Alarm wird nicht ausgelöst`
        )

        return false
      }
    }
  }

  mailParser (id: number, content: string): AlarmFactory {
    const alarm = new AlarmFactory(this.logger)
    alarm.origin('mail')
    alarm.applyTemplate(this.alarmTemplates.default)

    switch (this.mailSchema) {
      case 'SecurCad':
        return securCADParser(
          id,
          content,
          alarm,
          this.config,
          this.alarmTemplates
        )
      default:
        this.logger.log(
          'WARN',
          `Mail (${id.toString()}) - kein Mail-Parser definiert!`
        )
        return new AlarmFactory(this.logger)
    }
  }

  private handleError (err: any): void {
    this.logger.log('ERROR', this.logger.convertObject(err))
    this.emitter.emit('restartMailHandler')
  }
}

export default MailHandler
