# Meeting-Kosten-Timer

Ein Timer, der neben der Meetingdauer live mitzählt, was das Meeting kostet. Man kann zusehen, wie Zeit und Geld hochlaufen, und die Anzeige im Vollbild z. B. in einem Teams-Call teilen.

Die App läuft komplett im Browser. Es gibt keinen Server und keine Abhängigkeiten, und es wird nichts gespeichert.

## Funktionen

- **Live-Zähler** für Kosten (mit Cent-Beträgen) und Zeit, dazu Kosten pro Stunde und pro Minute sowie die Zahl der Anwesenden
- **Währungen:** Euro, US-Dollar, Britisches Pfund, Schweizer Franken, Japanischer Yen (nur Anzeige, keine Umrechnung)
- **Meetingtitel (optional):** Vor dem Start eingeben; er steht über dem Zähler, auch im Präsentationsmodus, im Browser-Tab nach dem Stopp, im kopierten Ergebnis und in geteilten Links
- **Teilnehmende einzeln erfassen:** Name oder Rolle und Anzahl (z. B. „3 × Entwickler“)
- **Stundensatz:** direkt eingeben oder aus dem Jahresgehalt berechnen lassen (Jahresgehalt ÷ Arbeitsstunden pro Jahr, Vorgabe 1720 h)
- **Start ab jetzt oder ab einer Uhrzeit** von heute, auch in der Vergangenheit; Zeit und Kosten zählen dann ab diesem Zeitpunkt
- **Während des Meetings:**
  - Personen hinzufügen, wahlweise „dabei seit jetzt“ oder „seit Meetingbeginn“
  - Personen entfernen; ihre bis dahin angefallenen Kosten bleiben erhalten
- **Link teilen:** Während oder nach dem Meeting einen Link erzeugen, über den andere denselben Timer schreibgeschützt sehen. Der gesamte Zustand steckt im Link, es ist kein Server nötig. Wahlweise ohne Namen und Stundensätze (nur Gesamtkosten).
- **Präsentationsmodus:** Vollbild mit großen Zahlen zum Teilen per Bildschirmfreigabe; mit Esc beenden
- **Ergebnis nach dem Stopp:** Gesamtkosten, Gesamtdauer, Zeitraum, Ø Kosten pro Minute, Kosten je Person; per Klick als Text kopierbar
- Der Bildschirm bleibt an, solange der Timer läuft (Screen Wake Lock, sofern vom Browser unterstützt)
- Läuft ein Meeting, warnt der Browser vor dem Neuladen oder Schließen des Tabs
- Helles und dunkles Farbschema je nach Systemeinstellung
- **Versionsnummer im Footer**, automatisch aus den Git-Tags (z. B. `v1.2.0`)

## Nutzung

1. Repository klonen oder herunterladen.
2. `index.html` im Browser öffnen. Ein Doppelklick genügt, die App funktioniert auch über `file://`.

```sh
git clone <repo-url>
cd meeting-cost-timer
open index.html        # macOS; unter Windows: start index.html, unter Linux: xdg-open index.html
```

Alternativ lässt sich die App als statische Seite hosten, z. B. über **GitHub Pages**. Der Workflow `.github/workflows/pages.yml` veröffentlicht die Seite **nur bei einem Tag `v*`**. Änderungen auf `main` sind also erst nach dem nächsten Release online. Dafür muss unter Settings → Pages als Source „GitHub Actions“ eingestellt sein.

### Versionsnummer

Die Version kommt aus den Git-Tags und wird beim Ausliefern in `js/version.js` geschrieben (`git describe --tags`):

- **GitHub Pages:** Der Pages-Workflow setzt sie bei jedem Deployment, also immer den Namen des Tags, z. B. `v1.2.0`.
- **Docker:** `docker build --build-arg VERSION=$(git describe --tags) .`; der Docker-Workflow übergibt bei einem Release den Tag automatisch.
- **Lokal** steht in `js/version.js` der Wert `dev`. Dann zeigt die App oben einen auffälligen gelb-schwarzen Balken „Entwicklungsversion (dev)“. Das gilt auch für ein Docker-Image, das ohne `--build-arg VERSION` gebaut wurde.

Neue Version veröffentlichen: Tag auf `main` setzen und pushen, z. B. `git tag -a v1.3.0 -m "v1.3.0" && git push origin v1.3.0`. Ein fehlgeschlagenes Deployment lässt sich mit `gh workflow run pages.yml --ref v1.3.0` wiederholen.

Hinweis: GitHub Pages erkennt Deployments am Commit-Hash. Ein zweites Tag auf einem bereits veröffentlichten Commit ändert die Seite deshalb nicht. Für jede neue Version braucht es also einen neuen Commit.

### Ablauf

1. Währung wählen und optional einen Meetingtitel eingeben.
2. Teilnehmende mit Stundensatz oder Jahresgehalt hinzufügen.
3. „Ab jetzt“ oder eine Startzeit wählen und **Start** drücken.
4. Optional auf **Präsentation** klicken und das Fenster im Call teilen, oder über **Link teilen** einen Link kopieren und z. B. in den Meeting-Chat posten.
5. Mit **Stopp** beenden. Das Ergebnis wird angezeigt und lässt sich kopieren.
6. **Neues Meeting** setzt alles zurück, auch die Teilnehmendenliste.

### Link teilen

- Der Link enthält den kompletten Stand des Meetings (Titel, Startzeit, ggf. Endzeit, Währung, Teilnehmende) im URL-Fragment (`#s=…`). Wer ihn öffnet, sieht den Timer schreibgeschützt; Kosten und Zeit berechnet der eigene Browser aus den Zeitstempeln.
- Der Link ist ein **Schnappschuss**. Werden danach Personen hinzugefügt oder entfernt oder wird das Meeting gestoppt, sehen andere das erst mit einem neuen Link. Die App weist darauf hin („Der geteilte Link ist veraltet“).
- Mit **Namen und Stundensätze ausblenden** enthält der Link nur Zeitabschnitte mit Kopfzahl und Gesamtsatz. Die Teilnehmendenliste wird dann nicht angezeigt. Ein Meetingtitel wird trotzdem mitgeteilt.
- Die Uhren der Geräte können um einige Sekunden voneinander abweichen.
- Damit andere den Link öffnen können, muss die App für sie erreichbar sein (z. B. GitHub Pages oder Docker). Ein Link auf eine lokal geöffnete `file://`-Datei funktioniert nur auf dem eigenen Rechner.

## Datenschutz

Alle Eingaben bleiben im Speicher des Browser-Tabs. Es gibt kein Tracking, keine Cookies, kein `localStorage` und keine Netzwerkanfragen. Nach dem Schließen oder Neuladen des Tabs sind alle Daten weg.

Ein Teilen-Link enthält die Daten des Meetings, standardmäßig auch **Namen und Stundensätze**. Wer den Link hat, kann daraus Rückschlüsse auf Gehälter ziehen. Wer das nicht möchte, setzt beim Teilen den Haken bei „Namen und Stundensätze ausblenden“. Die Daten stehen im Fragment hinter `#`, das der Browser beim Aufruf nicht an den Server schickt.

## Projektstruktur

| Datei        | Inhalt |
|--------------|--------|
| `index.html` | Markup: Großanzeige, Ergebnis, Formular und Liste der Teilnehmenden |
| `css/style.css` | Styles; Farbtokens in `:root` mit Dark-Mode-Overrides; Präsentationsmodus über `body.present` |
| `js/app.js`     | Zustand, Rendering, Event-Handler, Ticker, Präsentationsmodus, Wake Lock |
| `js/calc.js`    | Reine Berechnungslogik ohne DOM, auch in Node nutzbar |
| `js/version.js` | Versionsnummer; im Repo `dev` (mit Hinweisbalken), wird beim Ausliefern aus den Git-Tags gesetzt |
| `js/share.js`   | Kodieren/Dekodieren der Teilen-Links und Anonymisierung, ohne DOM, auch in Node nutzbar |
| `img/`          | Bilder und Icons (aus CSS als `url("../img/…")`, aus HTML als `img/…` einbinden) |
| `Dockerfile`, `.dockerignore` | Container mit nginx; `.dockerignore` hält Repo- und Doku-Dateien aus dem Image; Build-Argument `VERSION` |
| `.github/workflows/` | `pages.yml` veröffentlicht GitHub Pages bei Tags `v*` mit Versionsnummer, `docker.yml` baut bei Releases das Image |
| `CLAUDE.md`  | Hinweise für Claude Code (KI-Assistent) zur Arbeit am Repository |

## Weiterentwicklung

### Voraussetzungen

Für die App selbst nur ein aktueller Browser. Wer die Berechnungslogik testen will, braucht zusätzlich Node.js. Es gibt keinen Build-Schritt und kein `npm install`.

### Technische Entscheidungen

- **Keine ES-Module:** Die Skripte werden als klassische `<script>`-Tags geladen, weil Browser ES-Module über `file://` blockieren. `calc.js` und `share.js` registrieren sich im Browser als `window.MeetingCost` bzw. `window.MeetingShare` und exportieren in Node über `module.exports`.
- **Teilen ohne Backend:** Der Zustand wird als JSON, Base64url-kodiert, ins URL-Fragment geschrieben. Zeitpunkte stehen relativ zur Startzeit im Link, damit er kürzer bleibt. Es gibt bewusst keine Live-Synchronisation.
- **Keine Persistenz:** Das ist so gewollt. Bitte keinen Speicher (`localStorage`, Cookies, Backend) einbauen, ohne das vorher abzustimmen.
- **Ticker per `setInterval` (50 ms) statt `requestAnimationFrame`:** So läuft die Anzeige auch dann weiter, wenn das Fenster per Bildschirmfreigabe geteilt wird und nicht im Vordergrund ist.
- **Sprache:** Oberfläche und Code-Kommentare sind auf Deutsch. Zahlen und Uhrzeiten werden über `Intl` im Format `de-DE` angezeigt.

### Datenmodell

Der gesamte Zustand liegt in einem Objekt in `app.js`:

```js
state = {
  phase: 'setup' | 'running' | 'stopped',
  title,          // optionaler Meetingtitel ('' = keiner), wird beim Start übernommen
  startedAt,      // Zeitstempel (ms) des Meetingbeginns
  endedAt,        // Zeitstempel des Stopps
  participants: [ // ein Eintrag pro Zeile, ggf. mit Anzahl > 1
    { id, name, count, rate, joinedAt, leftAt }
  ],
  readonly,       // true, wenn über einen Teilen-Link geöffnet
  anonymous,      // true, wenn der Teilen-Link ohne Namen und Sätze erstellt wurde
}
```

- `rate` ist der Stundensatz **pro Person**.
- `joinedAt === null` heißt „seit Meetingbeginn dabei“ (gilt für alle, die vor dem Start eingetragen werden).
- `leftAt === null` heißt „noch dabei“. Wer während des Meetings entfernt wird, behält seinen Eintrag mit gesetztem `leftAt`. Vor dem Start wird ein Eintrag dagegen ganz gelöscht.
- Bei anonym geteilten Links ersetzt `share.js` die Einträge durch Zeitabschnitte (`count` = Köpfe, `rate` = Gesamtsatz ÷ Köpfe). So rechnet `calc.js` unverändert dieselben Kosten.

### Berechnung

Kosten je Eintrag (siehe `calc.js`):

```
Kosten = rate × count × (Ende − Beginn) / 1 h
Beginn = max(joinedAt, startedAt)   bzw. startedAt, wenn joinedAt null ist
Ende   = min(leftAt, jetzt)         bzw. jetzt, wenn leftAt null ist
```

Die Gesamtkosten sind die Summe aller Einträge. Nach dem Stopp liefert `now()` in `app.js` fest `endedAt` zurück, sodass alle Werte eingefroren bleiben.

### Testen

Für die Berechnungslogik gibt es noch keine Testdateien. Ein schneller Check in Node:

```sh
node -e '
const C = require("./js/calc.js");
const H = 3600000;
const p = { name: "Dev", rate: 60, count: 2, joinedAt: null, leftAt: null };
console.log(C.participantCost(p, 0, H)); // 120
console.log(C.formatDuration(3723000));  // 1:02:03

const S = require("./js/share.js");
const code = S.encode({ startedAt: 0, endedAt: H, currency: "EUR", participants: [p] });
console.log(C.totalCost(S.decode(code).participants, 0, H)); // 120
'
```

Oberfläche und Abläufe bitte manuell im Browser prüfen: Start ab jetzt und mit vergangener Startzeit, Personen während des Meetings hinzufügen und entfernen, Stopp, Präsentationsmodus, Teilen-Link (laufend, beendet, anonym, beschädigt), schmale Fensterbreite und Dark Mode.

### Bekannte Einschränkungen und Ideen

- Die Startzeit ist eine Uhrzeit **von heute**; Meetings über Mitternacht werden nicht unterstützt.
- Für Personen, die später dazukommen, gibt es nur „jetzt“ oder „Meetingbeginn“, keine frei wählbare Uhrzeit.
- Eine Pause-Funktion fehlt.
- Die Währung ändert nur die Anzeige; Stundensätze werden nicht umgerechnet.
- Automatisierte Tests (z. B. mit `node:test`) gibt es noch nicht.

## Lizenz

Noch keine Lizenz festgelegt. Ohne Lizenzdatei gilt das Urheberrecht des Autors, und andere dürfen den Code nicht ohne Weiteres nutzen oder verändern. Wenn das Projekt offen weiterentwickelt werden soll, eine `LICENSE`-Datei ergänzen (z. B. MIT).
