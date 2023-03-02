const fs = require('fs');
const path = require('path');
require('dotenv').config();

const configPath = process.env.DEV_CONFIG_PATH || './config';
const configDir = path.join(__dirname, configPath);

function generalConfiguration() {
    console.log('Option 1');
}

function mailConfiguration() {
    console.log('Option 2');
}

function serialConfiguration() {
    console.log('Option 3');
}

console.log("## Konfiguration überprüfen ##")
console.log('[1] Allgemeine Einstellungen - (general.json)');
console.log('[2] Mail Einstellungen - (mail.json)');
console.log('[3] Serielle Schnittstelle Einstellungen - (serial-dme.json)');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Welche Konfiguration soll überprüft werden? (1, 2 oder 3) ', (index) => {
    if (index === '1') {
        generalConfiguration();
    } else if (index === '2') {
        mailConfiguration();
    } else if (index === '3') {
        serialConfiguration();
    } else {
        console.log(`Invalid index: ${index}`);
    }

    readline.close();
});