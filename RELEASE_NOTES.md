# RepoQuest v1.0.0 — First Quest

Die erste spielbare, vollständig lesende GitHub-RPG-Erfahrung.

## Highlights

- GitHub-Repositories über Owner/Repo auswählen, öffentliche Repositories ohne Token auslesen.
- Private Repositories lokal über `GITHUB_TOKEN` und `GITHUB_ALLOWED_REPOS` importieren.
- Die letzten 100 Commits, offene und kürzlich geschlossene Issues, Pull Requests, CI-Läufe und Deployment-Status importieren.
- GitHub-Snapshots in SQLite mit Prisma normalisieren und bis zu fünf Snapshots je Repository aufbewahren.
- RPG-Agent **Lavinia** mit XP, Level, HP, Gold und vier Skills.
- SVG/CSS-Weltkarte aus Top-Level-Verzeichnissen mit Health, Komplexität und anklickbaren Regionen.
- Quest-Liste mit Typen aus Labels, Schwierigkeit, Belohnung und Abschlussverknüpfung.
- Chronik-Feed, CI-Übersicht, mobile UI und animiertes Level-Up.
- Vitest, Typecheck, Lint und GitHub Actions CI inklusive automatischem Tag-Release.

## Setup

1. Node.js 22 installieren.
2. `npm install`
3. `cp .env.example .env` (Windows PowerShell: `Copy-Item .env.example .env`)
4. `npm run db:push`
5. `npm run dev` und `http://localhost:3000` öffnen.

## Environment Variables

| Variable | Zweck |
| --- | --- |
| `DATABASE_URL` | SQLite-URL, lokal `file:./dev.db` |
| `GITHUB_TOKEN` | Optionales serverseitiges GitHub-PAT für private Repositories |
| `GITHUB_ALLOWED_REPOS` | Explizite Liste freigegebener Private-Repos (`owner/repo`, kommagetrennt) |
| `ALLOW_PRIVATE_REPOS_IN_PRODUCTION` | Standard `false`; nur mit vorgeschaltetem Zugriffsschutz aktivieren |

## Bekannte Einschränkungen

- Kein Login oder GitHub-Schreibzugriff.
- Die XP basieren auf den letzten importierten Datensätzen, nicht auf der vollständigen Repository-Historie.
- Die Zuordnung eines geschlossenen Issues zu einem Merge erfolgt über Closing-Keywords in PR-Titel/-Beschreibung; komplexere GitHub-Cross-References werden noch nicht aufgelöst.
- Region-Komplexität und Gesundheit sind heuristische Gameplay-Metriken, keine statische Codeanalyse.
- Maximal 100 Commits, je 100 offene und geschlossene Issues sowie 100 Pull Requests pro Snapshot.
- Ohne persistentes Volume verliert SQLite beim Neuaufbau eines Containers gespeicherte Snapshots.
- API-Rate-Limits und fehlende Actions-/Deployment-Berechtigungen können unvollständige Daten verursachen.

**Sicherheit:** GitHub-Tokens niemals in den Browser oder Git committen. Private Snapshots nur auf lokal oder durch einen Reverse Proxy geschützten Instanzen bereitstellen.
