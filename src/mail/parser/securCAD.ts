import AlarmFactory from "../../alarmFactory.js";
import { extractTableData } from "./helper.js";
import { Alarm } from "../../types/Alarm.js";
import { mailConfig } from "../../types/Config.js";

export function securCADParser(seqno: number, content: string, alarm: AlarmFactory, mailConfig: mailConfig, alarmTemplates: Record<string, Alarm>): AlarmFactory {
    let stichwoerter = mailConfig.stichwoerter;
    let alarmTemplateKeywords = mailConfig.alarmTemplateKeywords;

    let tableData = extractTableData(content);

    // Einsatznummer - ID
    let einsatznummer: string = tableData['Einsatznummer:']?.[0] || '';
    alarm.id(einsatznummer.toString());

    // Stichwort, Text und Einsatzobjekt
    let stichwort: string = tableData['Einsatzstichwort:']?.[0] || '';
    stichwort = stichwoerter[stichwort.toUpperCase()] || stichwort;
    let sachverhalt: string = tableData['Sachverhalt:']?.[0] || '';
    let notfallgeschehen: string = tableData['Notfallgeschehen:']?.[0] || '';

    let objekt = tableData['Objekt:']?.[0] || '';
    alarm.object(objekt);

    if (notfallgeschehen) {
        const matchResult = notfallgeschehen.match(/\((.*)\)/);
        if (matchResult) {
            alarm.title(matchResult[1] || notfallgeschehen || "");
        } else {
            alarm.title(notfallgeschehen || "");
        }
    } else if (stichwort) {
        alarm.title(stichwort);
    }


    alarm.text(sachverhalt ? (objekt ? sachverhalt + ' - ' + objekt : sachverhalt) : objekt);

    // Adresse
    alarm.street(tableData['Strasse / Hs.-Nr.:']?.[0] || tableData['Strasse:']?.[0] || '');

    alarm.city(tableData['PLZ / Ort:']?.[0] || '');
    alarm.addressInfo(tableData['Info:']?.[0] || '');

    // Einsatzvorlagen anwenden - Empfängergruppen und alarmierte Fahrzeuge
    for (let keyword in alarmTemplateKeywords) {
        if (tableData[keyword]) {
            // Keyword existiert in Alarm Mail
            let template = alarmTemplateKeywords[keyword];
            alarm.applyTemplate(alarmTemplates[template]);
        }
    }
    return alarm;
}
