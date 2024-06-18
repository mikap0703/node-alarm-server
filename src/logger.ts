import chalk from 'chalk'
import path from 'path'

type logType = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export interface ILogger {
  log: (type: logType, payload: string) => void
  convertObject: (o: any) => string
}

export default class Logger implements ILogger {
  private readonly logDir: string

  constructor (dirname: string) {
    this.logDir = path.join(dirname, 'logs')
  }

  log (type: logType, payload: string): void {
    let doLog = chalk.red
    switch (type) {
      case 'INFO':
        doLog = chalk.bold.green
        break
      case 'WARN':
        doLog = chalk.bold.yellow
        break
      case 'ERROR':
        doLog = chalk.bold.red
        break
      case 'DEBUG':
        doLog = chalk.bold.blue
        break
    }
    console.log(doLog(`[${type}] - ${payload}`))
  }

  convertObject (o: any): string {
    return typeof o + ': ' + JSON.stringify(o, null, '\t')
  }
}
