import type AlarmFactory from '../../alarmFactory.js'
import { type Alarm } from '../../types/Alarm.js'
import { type mailConfig } from '../../types/Config.js'
import { extractTableData } from "./helper.js";

export function securCADParser (
  seqno: number,
  content: string,
  alarm: AlarmFactory,
  mailConfig: mailConfig,
  alarmTemplates: Record<string, Alarm>
): AlarmFactory {
  const stichwoerter = mailConfig.stichwoerter
  const alarmTemplateKeywords = mailConfig.alarmTemplateKeywords

  const tableData = extractTableData(content)

  // Einsatznummer - ID
  const einsatznummer: string = tableData['Auftragsnummer:']?.[0] ?? ''
  alarm.id(einsatznummer.toString())

  // Stichwort, Text und Einsatzobjekt
  let stichwort: string = tableData['Einsatzstichwort:']?.[0] ?? ''
  stichwort = stichwoerter[stichwort.toUpperCase()] ?? stichwort
  const sachverhalt: string = tableData['Sachverhalt:']?.[0] ?? ''
  const notfallgeschehen: string = tableData['Notfallgeschehen:']?.[0] ?? ''

  const objekt = tableData['Objekt:']?.[0] ?? ''
  alarm.object(objekt)

  if (notfallgeschehen !== '') {
    const matchResult = notfallgeschehen.match(/\((.*)\)/)
    if (matchResult != null) {
      alarm.title(matchResult[1] ?? notfallgeschehen ?? '')
    } else {
      alarm.title(notfallgeschehen ?? '')
    }
  } else if (stichwort !== '') {
    alarm.title(stichwort)
  }

  if (sachverhalt !== '') {
    if (objekt !== '') {
      alarm.text(sachverhalt + ' - ' + objekt)
    } else {
      alarm.text(sachverhalt)
    }
  } else {
    alarm.text(objekt)
  }

  // Adresse
  alarm.street(
    tableData['Strasse / Hs.-Nr.:']?.[0] ?? tableData['Strasse:']?.[0] ?? ''
  )

  alarm.city(tableData['PLZ / Ort:']?.[0] ?? '')
  alarm.addressInfo(tableData['Info:']?.[0] ?? '')
  alarm.utm(tableData['UTM - Koordinaten:']?.[0] ?? '')
  const coordsText = tableData['Geopositionen:'] ?? []
  const latText = coordsText?.[1].match(/\d+,\d+/)?.[0] ?? ''
  const lonText = coordsText?.[0].match(/\d+,\d+/)?.[0] ?? ''

  if (latText !== '' && lonText !== '') {
    alarm.lon(parseFloat(latText.replace(',', '.')))
    alarm.lat(parseFloat(lonText.replace(',', '.')))
  }

  if (alarm.data.address.info !== '') {
    alarm.addToText('\n' + alarm.data.address.info)
  }

  if (alarm.data.address.utm !== '') {
    alarm.addToText('\n\n' + 'UTM: ' + alarm.data.address.utm)
  }

  const lat = alarm.data.address.coords.lat
  const lon = alarm.data.address.coords.lon

  if (lat != null && lon != null) {
    alarm.addToText('\n\n' + 'Koordinaten: ' + lat + ', ' + lon)

    // todo: maybe move this to a general function
    const link = `http://maps.apple.com/?q=${lon},${lat}`

    alarm.addToText('\n' + link)
  }


  // Einsatzvorlagen anwenden - Empfängergruppen und alarmierte Fahrzeuge
  for (const keyword in alarmTemplateKeywords) {
    if (tableData[keyword] != null) {
      // Keyword existiert in Alarm Mail
      const template = alarmTemplateKeywords[keyword]
      alarm.applyTemplate(alarmTemplates[template])
    }
  }
  return alarm
}
