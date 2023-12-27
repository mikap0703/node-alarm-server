export interface gConfig {
  api: 'Divera' | 'Alamos'
  apiKey: string
  timeout: number
  serialDME: boolean
  mail: boolean
  alarm: boolean
  [key: string]: any
}
