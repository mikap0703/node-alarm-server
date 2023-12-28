import type AlarmFactory from "../../alarmFactory.js";
import { extractTableData } from "./helper.js";
import { type Alarm } from "../../types/Alarm.js";
import { type mailConfig } from "../../types/Config.js";

export function securCADParser(
  seqno: number,
  content: string,
  alarm: AlarmFactory,
  mailConfig: mailConfig,
  alarmTemplates: Record<string, Alarm>,
): AlarmFactory {
  const stichwoerter = mailConfig.stichwoerter;
  const alarmTemplateKeywords = mailConfig.alarmTemplateKeywords;

  const tableData = extractTableData(content);

  // Einsatznummer - ID
  const einsatznummer: string = tableData["Einsatznummer:"]?.[0] ?? "";
  alarm.id(einsatznummer.toString());

  // Stichwort, Text und Einsatzobjekt
  let stichwort: string = tableData["Einsatzstichwort:"]?.[0] ?? "";
  stichwort = stichwoerter[stichwort.toUpperCase()] ?? stichwort;
  const sachverhalt: string = tableData["Sachverhalt:"]?.[0] ?? "";
  const notfallgeschehen: string = tableData["Notfallgeschehen:"]?.[0] ?? "";

  const objekt = tableData["Objekt:"]?.[0] ?? "";
  alarm.object(objekt);

  if (notfallgeschehen !== "") {
    const matchResult = notfallgeschehen.match(/\((.*)\)/);
    if (matchResult != null) {
      alarm.title(matchResult[1] ?? notfallgeschehen ?? "");
    } else {
      alarm.title(notfallgeschehen ?? "");
    }
  } else if (stichwort !== "") {
    alarm.title(stichwort);
  }

  if (sachverhalt !== "") {
    if (objekt !== "") {
      alarm.text(sachverhalt + " - " + objekt);
    } else {
      alarm.text(sachverhalt);
    }
  } else {
    alarm.text(objekt);
  }

  // Adresse
  alarm.street(
    tableData["Strasse / Hs.-Nr.:"]?.[0] ?? tableData["Strasse:"]?.[0] ?? "",
  );

  alarm.city(tableData["PLZ / Ort:"]?.[0] ?? "");
  alarm.addressInfo(tableData["Info:"]?.[0] ?? "");

  // Einsatzvorlagen anwenden - Empfängergruppen und alarmierte Fahrzeuge
  for (const keyword in alarmTemplateKeywords) {
    if (tableData[keyword] != null) {
      // Keyword existiert in Alarm Mail
      const template = alarmTemplateKeywords[keyword];
      alarm.applyTemplate(alarmTemplates[template]);
    }
  }
  return alarm;
}
