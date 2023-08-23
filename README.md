# node-alarm-server

## Features
### Alarm-Dienste
Folgende APIs und Alarm-Apps werden unterstützt:

| Alarm-Dienst    | Unterstützt |
|-----------------|-------------|
| Divera (API v2) | ✅           |
| RETTERAlarm     | 🔜          |
| Telegram        | 🔜          |

Weitere Möglichkeiten werden nach Bedarf hinzugefügt.

### Alarm-Quellen
#### E-Mail
Die aktuelle Auswertung funktioniert mit einer flexiblen Tabellenauswertung.
#### Digitaler Meldeempfänger
Die aktuelle Auswertung funktioniert mit einem Boss 925 mit offener, serieller Schnittstelle.
Weitere Melder werden nach Bedarf hinzugefügt.

## Installation und Verwendung

Das Programm wird vor allem auf Ubuntu Systemen getestet und verwendet NodeJS und Typescript.

Zur Installation wird Docker empfohlen (Dokumentation folgt). Alternativ steht der folgende Wer zur Installation zur Verfügung:

1. Repository clonen: `git clone https://github.com/mikap0703/node-alarm-server.git`
2. Navigiere zum Projektverzeichnis: `cd ./node-alarm-server`
3. Abhänigkeiten installieren: `npm install`
4. Config-Dateien bearbeiten
5. Programm starten `npm start`

## Konfiguration
### Allgemeine Einstellungen - general.yml

```yaml
# App zur Alarmierung hier angeben
api: "Divera/RETTERAlarm/..."

# API-Key/Accessschlüssel
apiKey: asdf1234

# Start/Restart (bei Fehler) Timeout
timeout: 5000

# Serielles Schnittstelle aktivieren/deaktivieren
serialDME: false

# Mailauswertung aktivieren/deaktivieren
mail: true

# Weiterleiten von Alarmen aktivieren/deaktivieren
alarm: false
```

### Mail Einstellungen - mail.yml

```yaml
# E-Mail Adresse, an die das Alarmfax geschickt wird
user: einsatz@ffw-musterstadt.de

# Passwort für das IMAP Postfach
password: 123456

# URL des IMAP Servers
host: imap.goneo.de

# Port des IMAP Servers
port: 993

# TLS verwenden: ja/nein
tls: true

# maximales Alter der Mails, die ausgewertet werden sollen in Sekunden
maxAge: 300

# Absender, bei dem der Alarm ausgelöst wird oder *
alarmSender: alarm@leitstelle.de

# Betreff bei dem der Alarm ausgelöst wird oder *
alarmSubject: Test

# Schlüsselwörter für Alarmtemplates, siehe Dokumentation
alarmTemplateKeywords:
  FW Musterstadt Vollalarm: Musterstadt Vollalarm
  FW Musterstadt Wehrführung: Wehrführung
  FW Musterstadt DL: DLK

# Mail Schema: SecurCad/...
mailSchema: SecurCad

# Stichwortverzeichnis
stichwoerter:
  B1: Brand 1
  B2: Brand 2
  B3: Brand 3
  B4: Brand 4
  VUP: VU mit Person
  VU: Verkehrsunfall

```

## DME Einstellungen, serielle Schnittstelle - serialDME.yml

```yaml
# Serieller Port, an dem der Melder angeschlossen ist
port: "/dev/ttyUSB0"

# Trennzeichen, der am Ende, jeder Einsatzmeldung kommt. Standard: \\r\\n\\0
delimiter: "\\r\\n\\0"

# Baudrate des Melders. Standard: 9600
baudrate: 9600

# DME Stichwortverzeichnis
alarmList:
  - Brand 1
  - Brand 2
  - Brand 3
  - Brand 4
  - VU mit Person
  - Verkehrsunfall

# Zuordnung Rics <-> Alarmtemplates
rics:
  - Fw MS VA:
      groups:
        - Mannschaft Gruppe
      vehicles:
        - FL MS 1/10
        - FL MS 1/31
        - FL MS 1/46
      members: []
  - FW MS DLK:
      groups:
        - DLK Gruppe
      vehicles:
        - FL MS 1/10
        - FL MS 1/31
      members: []
```

## AlarmTemplates und Voreinstellungen verwalten - alarmTemplates.yml

```yaml
default:
  members: # Einzelne Personen, die dem Einsatz zugeordnet werden sollen
    - WehrführerID

Musterstadt Vollalarm:
  groups: # Gruppen, die dem Einsatz zugeordnet werden sollen
    - Mannschaft Gruppe
  vehicles: # Fahrzeuge, die dem Einsatz zugeordnet werden sollen
    - FL MS 1/10
    - FL MS 1/31
    - FL MS 1/46
  webhooks: # Webhooks, die ausgelöst werden sollen, z.B. Schranke mit Shelly Relais öffnen
    - "http://192.168.178.112/relay/1"

DLK:
  groups:
    - DLK Gruppe
  vehicles:
    - FL MS 1/10
    - FL MS 1/31

Wehrführung:
  vehicles:
    - FL MS 0/10
  members:
    - WehrführerID
```