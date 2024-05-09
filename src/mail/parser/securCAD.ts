import type AlarmFactory from '../../alarmFactory.js'
import { type Alarm } from '../../types/Alarm.js'
import { type mailConfig } from '../../types/Config.js'
import {JSDOM} from "jsdom";
import {extractTableData2} from "./helper.js";

export function securCADParser (
  seqno: number,
  content: string,
  alarm: AlarmFactory,
  mailConfig: mailConfig,
  alarmTemplates: Record<string, Alarm>
): AlarmFactory {
  const stichwoerter = mailConfig.stichwoerter
  const alarmTemplateKeywords = mailConfig.alarmTemplateKeywords

  const tableData = extractTableData2(content)

  /*
  // Einsatznummer - ID
  const einsatznummer: string = tableData['Einsatznummer:']?.[0] ?? ''
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

  if (alarm.data.address.info !== '') {
    alarm.addToText('\n' + alarm.data.address.info)
  }

  if (alarm.data.address.utm !== '') {
    alarm.addToText('\n\n' + 'UTM: ' + alarm.data.address.utm)
  }
   */

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


function extractTableData (html: string, alarm: AlarmFactory): Record<string, string[]> {
  const dom: JSDOM = new JSDOM(html)
  const tables = dom.window.document.getElementsByTagName('table')
  const result: Record<string, string[]> = {}

  console.log(tables.length)

  for(const table of tables) {
    handleTableData(table, alarm)
  }

  return result
}

function handleTableData(table: HTMLTableElement, alarm: AlarmFactory) {
  if (table.rows.length < 1) {
    return
  }

  const firstCell = table.rows[0].cells[0].textContent
  console.log(firstCell)

  switch(firstCell) {
    case "Einsatzstichwort: ": {
      const stichwort = table.rows[0].cells[1].textContent
      break
    }
    case "Strasse / Hs.-Nr.: ": {
      const street = table.rows[0].cells[1].textContent
      const segment = table.rows[1].cells[1].textContent
      const city = table.rows[2].cells[1].textContent

      if (street) {
        alarm.street(street)
      }

      if (city) {
        alarm.city(city)
      }

      break
    }
    case "UTM - Koordinaten: ": {
      const utm = table.rows[0].cells[1].textContent
      if (utm) {
        alarm.utm(utm)
      }
      break
    }
    case "Geopositionen: ": {
      // todo: add to alarm
      const pattern = /(\d+,\d+)/g

      const lngCell = table.rows[0].cells[1].textContent
      const lng = lngCell?.match(/\d+,\d+/)?[0] : ""
      const latCell = table.rows[1].cells[1].textContent
      const lat = latCell?.match(/\d+,\d+/)?[0] : ""
      break
    }
    case " Zusatztext zum Ort: ": {
      // todo: get data from next table
      break
    }
    case "Patient Name: ": {
      // todo: add to alarm
      const name = table.rows[0].cells[1].textContent
      break
    }
    case "Alarmierte Ressourcen: ": {
      break
    }
    case "Name: ": {
      // Meldender des Hilfeersuchens
      const name = table.rows[0].cells[1].textContent
      break
    }
  }
}


function generateObjectFromTable (table: HTMLTableElement): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  for (const row of table.rows) {
    const key = row.cells[0].textContent

    if (key) {
      result[key] = []
    } else {
      continue
    }

    let i = 0
    for (const cell of row.cells) {
      if (i === 0) {
          continue
      }

      if (cell.textContent) {
          result[key].push(cell.textContent)
      }

      i++
    }
  }

  return result
}
