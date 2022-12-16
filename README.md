# gc-cli-research

## Setup

Run `chmod +x ./sipgate-io`

## How to use

Start sipgate-io cli with `./sipgate-io`.

## Requirements

- gh
  - Setup MacOs `brew install gh`
  - Setup [Linux](https://github.com/cli/cli/blob/trunk/docs/install_linux.md)

## Ablaufplan

1. CLI aufsetzen und [sipgate-node](https://github.com/sipgate-io/sipgateio-node) integrieren, um Webhook URL setzen zu können
2. Über GitHub Public API [github CLI](https://cli.github.com/manual/gh) Sipgate Repo anfordern
3. Google Cloud Projekt automatisiert erstellen über [Resource Manager API](https://cloud.google.com/nodejs/docs/reference/resource-manager/latest)
4. Über [ADMIN-API](https://cloud.google.com/appengine/docs/admin-api/creating-an-application?hl=de#console) App Engine Projekt bereitstellen (aus Sipgate Repo)
5. Anwendungs-Ressourcen (Repo-Files) in cloud Storage Bucket für AppEngine hochladen über [NodeJS-Storage](https://github.com/googleapis/nodejs-storage)
6. app.yaml /app.json Konfigurationsdatei implementieren für App Engine (Benötigt cloud storage bucket url)
7. Anwendung über die Admin API in App Engine bereitstellen und Webhook herausfiltern
8. Webhook URL aus App Engine Projekt über sipgate-node integrieren

## FAQ

### Womit bauen wir das CLI-Tool?

Wir benutzen [Commander](https://github.com/tj/commander.js#quick-start), weil das im Vergleich zu den Alternativen noch maintained wird.

### Wie deployen wir Code von IO-Repos automatisiert in Google Cloud?
