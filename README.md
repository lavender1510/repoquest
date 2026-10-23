# ⚔ RepoQuest

**Dein Repository. Deine Legende.** Ein modernes, deutschsprachiges und vollständig read-only GitHub-RPG-Dashboard.

RepoQuest verwandelt Commits in Geschichtsereignisse, Issues in Quests, Bugs in Monster, CI-Jobs in Test-Wachen und Deployments in Portale. Ordner deiner Codebasis werden zu einer anklickbaren, prozedural platzierten Weltkarte. Alle GitHub-Zugriffe sind ausschließlich lesend – keine Issues, Dateien, PRs oder Deployments werden verändert.

## Screenshots

> Screenshots-Platzhalter für das erste UI-Capture nach dem lokalen Start.
>
> - **Dashboard:** `docs/screenshots/dashboard.png` — Heldenprofil, Repo-Stats und Quests.
> - **Weltkarte:** `docs/screenshots/world-map.png` — interaktive Regionen-Topologie.
> - **Mobile:** `docs/screenshots/mobile.png` — responsives Layout.

Das UI zeigt beim ersten Öffnen einen **ausdrücklich als Vorschau markierten** Demo-Snapshot. Sobald du ein Repository synchronisiert hast, ersetzt RepoQuest diesen durch echte GitHub-Daten.

## Architektur

```text
Browser / Next.js UI (React, Tailwind, SVG)
             │
       POST /api/import ────────── Octokit REST API (READ ONLY)
             │                      │
         Zod Validation         GitHub Data
             │                      │
             └────────┬─────────────┘
                      │
                 RPG-Engine
             XP / Quests / Regions / Chronicle
                      │
              Prisma + SQLite
            Repository / Snapshot
          Issues / PRs / Runs / Events
                      │
                 GET Dashboard
```

- **Next.js 15** App Router, React 19, TypeScript, Tailwind CSS 4.
- **Octokit REST** für Commits, Issues, PRs, Action-Runs, Top-Level-Ordner und Deployments.
- **Prisma + SQLite** mit normalisierten Tabellen und fünf rotierenden Snapshots je Repository.
- **Zod** zur Validierung von GitHub-Repository-Parametern.
- **Vitest**, ESLint, Prettier, GitHub Actions CI und Tag-basierte Release-Pipeline.
- Keine externe Game Engine und kein OAuth-Login für v1.0.0.

## Voraussetzungen

- Node.js **22** empfohlen (mindestens 20.9)
- npm 10+
- Eine Internetverbindung für npm und GitHub-API
- Optional: GitHub Personal Access Token mit **Read**-Berechtigungen.

## Setup / lokale Entwicklung

```bash
# Repository klonen oder Projektverzeichnis öffnen
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Windows PowerShell:

```powershell
npm install
Copy-Item .env.example .env
npm run db:push
npm run dev
```

Anschließend **http://localhost:3000** öffnen. `npm run dev` führt über `predev` selbstständig `prisma db push` aus. Für einen Production-Build:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

Für weitere Aufgaben:

| Befehl | Bedeutung |
| --- | --- |
| `npm run db:push` | SQLite-Schema anwenden |
| `npm run db:generate` | Prisma Client generieren |
| `npm run test:watch` | Vitest während der Entwicklung |
| `npm run format` | Dateien mit Prettier formatieren |
| `npm run release:notes -- v1.0.0` | Release-Notes generieren |

## Umgebungsvariablen

Alle Variablen sind in **`.env.example`** dokumentiert. Kopiere diese nach `.env` und passe sie an; **niemals** echte Tokens einchecken.

| Variable | Erforderlich | Beschreibung |
| --- | --- | --- |
| `DATABASE_URL` | Ja | SQLite: `file:./dev.db` (relativ zu `src/server/db/schema.prisma`) |
| `GITHUB_TOKEN` | Nein | Serverseitiger PAT für private Repositories |
| `GITHUB_ALLOWED_REPOS` | Nur für private Repos | Kommagetrennte Allowlist, z. B. `lavender1510/repoquest` |
| `ALLOW_PRIVATE_REPOS_IN_PRODUCTION` | Nein | Standard `false`. Nur hinter geschütztem Reverse Proxy auf `true` setzen |

### GitHub Token / Berechtigungen

Öffentliche Repositories werden **ohne Token** gelesen. Für private Repositories prüft RepoQuest zuerst den anonymen Zugriff. Nur bei fehlendem öffentlichen Zugriff und passender Allowlist verwendet es das Token. Empfohlene fine-grained PAT-Rechte: **Metadata: Read**, **Contents: Read**, **Issues: Read**, **Pull requests: Read**, **Actions: Read** und **Deployments: Read**. Das Token bleibt in der Serverumgebung und wird weder im Browser noch in SQLite gespeichert. GitHub-Rate-Limits werden nutzerfreundlich gemeldet.

**Sicherheitsgrenze:** RepoQuest hat im MVP kein Benutzerlogin. Wer eine öffentlich erreichbare Instanz öffnen kann, kann deren sichtbare Snapshots lesen. Private Repos sind deshalb in Produktion standardmäßig blockiert. Aktiviere private Nutzung in Produktion ausschließlich bei einem durch Authentifizierung geschützten Reverse Proxy. Die Allowlist schützt vor unkontrolliertem PAT-Zugriff, ersetzt aber keine Benutzer-Authentifizierung.

## Datenimport und Gameplay

Das Formular nimmt `owner` und `repo`. Der Import liest:

1. Letzte **100 Commits** (Dateilisten werden für 12 Commits ergänzt).
2. Bis zu **100 offene** und **100 kürzlich geschlossene Issues** (PRs werden aus der Issue-API ausgefiltert).
3. Bis zu **100 PRs**, inklusive `merged_at` und Dateilisten für die neuesten acht PRs.
4. Letzte **25 Workflow-Runs**, soweit lesbar.
5. Bis zu **10 Deployments** plus letzten Status, soweit lesbar.
6. Bis zu **24 Top-Level-Verzeichnisse** und eine synthetische `root`-Region.

GitHub-Unterabfragen für CI/Deployments/Dateien dürfen fehlschlagen; das Dashboard zeigt Warnungen und verwendet verfügbare Daten. Die Basisdaten (Commits, Issues, PRs) müssen erfolgreich importiert werden. Ein Repository hat einen lokalen Import-Cooldown von 20 Sekunden (in einer einzelnen Node-Instanz).

**XP-Regeln:** Gemergter PR +50, geschlossenes Issue +30, zusätzlich Bug-Label auf gemergtem PR +80, erfolgreicher CI-Lauf +10, erfolgreiches Deployment +40. Level ist `1 + floor(XP / 100)`. Alle Boni basieren auf eindeutigen importierten IDs: wiederholte Imports sind keine extra XP. Es handelt sich um ein **Importfenster**, keine vollständige historische GitHub-Bilanz; Scores können sich mit dem Fenster verändern.

**Quest-Regeln:** `good first issue` → Tutorial, `bug` → Monsterjagd, `enhancement`/`feature` → Bauauftrag, `documentation`/`docs` → Forschung, sonst Erkundung. Schwierigkeit und Belohnung sind deterministisch. Ein geschlossenes Issue gilt als „durch PR erledigt“, wenn ein gemergter PR `fixes #123`/`closes #123`/`resolves #123` enthält. Ohne diesen Nachweis wird es nur als geschlossen angezeigt, nicht als PR-Besiegung.

**Regionen:** Top-Level-Ordner plus Zitadelle `/`. Ordnerzuweisung basiert auf erkennbaren Pfadnamen im Issue-Text und jüngsten Commit-Dateien; unbekannte Zuordnung → `root`. Health (0–100) basiert auf offenen Issues, Bug-Last, fehlgeschlagener CI (Zitadelle) und einer Änderungsaktivitäts-Proxymetrik; Complexity ist eine **Schätzung**, keine AST-Analyse.

## API

`POST /api/import`:

```bash
curl -X POST http://localhost:3000/api/import \
  -H 'Content-Type: application/json' \
  -d '{"owner":"lavender1510","repo":"repoquest"}'
```

Ergebnis: `{ dashboard, levelUp, newAbility }` oder `{ error }` mit entsprechendem HTTP-Status. `GET /api/dashboard` liefert den neuesten lokal gespeicherten Snapshot, optional `?owner=lavender1510&repo=repoquest`. Die API enthält **keine GitHub-Schreibmethoden**.

## Deployment

**Empfohlen: Node.js-Server oder Docker mit persistenter Festplatte.** SQLite eignet sich nicht für flüchtige, verteilte Serverless-Instanzen ohne dauerhaften Speicher. Next.js-Node-Deployment ist vollständig unterstützt.

### Docker

```bash
docker compose up --build -d
```

Öffne **http://localhost:3000**. Die SQLite-Datei liegt im Host-Ordner `./data`. Für Produktionsbetrieb HTTPS/TLS, Zugriffsschutz (insbesondere bei privaten Repos), Backups und einen persistenten Datenträger vorsehen. `GITHUB_TOKEN` ausschließlich über Server-Environment oder Secret-Management bereitstellen.

### Manueller Node-Server

```bash
npm install
npm run db:push
npm run build
npm run start
```

Bei eigenem Server sollte `DATABASE_URL` auf einen persistenten Pfad zeigen. Falls CI/Deployment aus einem frischen Image erfolgt, vorher `npm run db:push` aufrufen.

## CI und GitHub Release

CI (`.github/workflows/ci.yml`) läuft bei Push auf `main` und bei PRs gegen `main`: Installation, SQLite-Setup, TypeScript-Check, ESLint, Vitest und Production-Build.

Release (`.github/workflows/release.yml`) wird bei Tags `v*` ausgelöst. Es wiederholt alle Checks, generiert Release Notes aus Conventional Commits (beim ersten Tag zusätzlich `RELEASE_NOTES.md`) und veröffentlicht mit der GitHub CLI. Für `v1.0.0` ist der Titel exakt **RepoQuest v1.0.0 — First Quest**. `permissions: contents: write` ist gesetzt. Der Release enthält das Quellarchiv; ein Webprojekt benötigt keinen EXE-Installer.

### Neues GitHub-Repository anlegen und v1.0.0 veröffentlichen

1. Auf GitHub ein **leeres** Repository [`lavender1510/repoquest`](https://github.com/new) erstellen: Name `repoquest`, Besitzer `lavender1510`, **ohne** README/License/.gitignore.
2. Im Projektverzeichnis folgende Befehle ausführen:

```bash
git init -b main
git add .
git commit -m "feat: launch RepoQuest read-only RPG dashboard"
git remote add origin https://github.com/lavender1510/repoquest.git
git push -u origin main
git tag -a v1.0.0 -m "RepoQuest v1.0.0 — First Quest"
git push origin v1.0.0
```

3. Nach erfolgreichem CI/Tag-Workflow erscheint die Release unter `https://github.com/lavender1510/repoquest/releases/tag/v1.0.0`.

Falls `gh` **lokal** installiert und authentifiziert ist, kann die Release alternativ **manuell** erstellt werden (nicht zusätzlich zum aktiven Workflow ausführen):

```bash
gh release create v1.0.0 --title "RepoQuest v1.0.0 — First Quest" --notes-file RELEASE_NOTES.md
```

Fehlt `gh` lokal, genügt `git push origin v1.0.0`: Auf dem GitHub Actions Runner ist die CLI verfügbar. Für spätere Releases `git tag -a v1.0.1 ...` und Tag pushen.

## Known Limitations

- Read-only MVP ohne Multiuser-Login oder OAuth-Sitzung.
- Top-Level-Ordner auf 24 begrenzt; große Repositories können weitere Ordner / historische Issues haben.
- PR-Issue-Verknüpfungen sind eine Closing-Keyword-Heuristik, nicht die vollständige GitHub-Timeline.
- XP-Score spiegelt die letzte Importauswahl wider und kann sich bei neuen Snapshots ändern.
- Ohne `Actions: Read` oder `Deployments: Read` werden diese Daten ausgelassen.
- In einer verteilten Infrastruktur muss der Import-Cooldown über ein gemeinsames Rate-Limit-System abgesichert werden.
- Prisma-SQLite ist für Single-Instance-Betrieb gedacht. Für mehrere Worker ist ein DB-Wechsel notwendig.

## Lizenz

[MIT](LICENSE) · 2026 lavender1510
