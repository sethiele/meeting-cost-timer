# Meeting-Kosten-Timer

Ein Timer, der neben der Meetingdauer live mitzählt, was das Meeting kostet. Man kann zusehen, wie Zeit und Geld hochlaufen, und die Anzeige im Vollbild z. B. in einem Teams-Call teilen.

Die App läuft komplett im Browser. Es gibt keinen Server und keine Abhängigkeiten, und es wird nichts gespeichert.

## Funktionen

- **Live-Zähler** für Kosten (mit Cent-Beträgen) und Zeit, dazu Kosten pro Stunde und pro Minute sowie die Zahl der Anwesenden
- **Währungen:** Euro, US-Dollar, Britisches Pfund, Schweizer Franken, Japanischer Yen (nur Anzeige, keine Umrechnung)
- **Teilnehmende einzeln erfassen:** Name oder Rolle und Anzahl (z. B. „3 × Entwickler“)
- **Stundensatz:** direkt eingeben oder aus dem Jahresgehalt berechnen lassen (Jahresgehalt ÷ Arbeitsstunden pro Jahr, Vorgabe 1720 h)
- **Start ab jetzt oder ab einer Uhrzeit** von heute, auch in der Vergangenheit; Zeit und Kosten zählen dann ab diesem Zeitpunkt
- **Während des Meetings:**
  - Personen hinzufügen, wahlweise „dabei seit jetzt“ oder „seit Meetingbeginn“
  - Personen entfernen; ihre bis dahin angefallenen Kosten bleiben erhalten
- **Präsentationsmodus:** Vollbild mit großen Zahlen zum Teilen per Bildschirmfreigabe; mit Esc beenden
- **Ergebnis nach dem Stopp:** Gesamtkosten, Gesamtdauer, Zeitraum, Ø Kosten pro Minute, Kosten je Person; per Klick als Text kopierbar
- Der Bildschirm bleibt an, solange der Timer läuft (Screen Wake Lock, sofern vom Browser unterstützt)
- Läuft ein Meeting, warnt der Browser vor dem Neuladen oder Schließen des Tabs
- Helles und dunkles Farbschema je nach Systemeinstellung

## Nutzung

1. Repository klonen oder herunterladen.
2. `index.html` im Browser öffnen. Ein Doppelklick genügt, die App funktioniert auch über `file://`.

```sh
git clone <repo-url>
cd meeting-cost-timer
open index.html        # macOS; unter Windows: start index.html, unter Linux: xdg-open index.html
```

Alternativ lässt sich die App als statische Seite hosten, z. B. über **GitHub Pages** (Settings → Pages → Branch `main`, Ordner `/`).

### Ablauf

1. Währung wählen.
2. Teilnehmende mit Stundensatz oder Jahresgehalt hinzufügen.
3. „Ab jetzt“ oder eine Startzeit wählen und **Start** drücken.
4. Optional auf **Präsentation** klicken und das Fenster im Call teilen.
5. Mit **Stopp** beenden. Das Ergebnis wird angezeigt und lässt sich kopieren.
6. **Neues Meeting** setzt alles zurück, auch die Teilnehmendenliste.

## Datenschutz

Alle Eingaben bleiben im Speicher des Browser-Tabs. Es gibt kein Tracking, keine Cookies, kein `localStorage` und keine Netzwerkanfragen. Nach dem Schließen oder Neuladen des Tabs sind alle Daten weg.

## Projektstruktur

| Datei        | Inhalt |
|--------------|--------|
| `index.html` | Markup: Großanzeige, Ergebnis, Formular und Liste der Teilnehmenden |
| `style.css`  | Styles; Farbtokens in `:root` mit Dark-Mode-Overrides; Präsentationsmodus über `body.present` |
| `app.js`     | Zustand, Rendering, Event-Handler, Ticker, Präsentationsmodus, Wake Lock |
| `calc.js`    | Reine Berechnungslogik ohne DOM, auch in Node nutzbar |
| `CLAUDE.md`  | Hinweise für Claude Code (KI-Assistent) zur Arbeit am Repository |

## Weiterentwicklung

### Voraussetzungen

Für die App selbst nur ein aktueller Browser. Wer die Berechnungslogik testen will, braucht zusätzlich Node.js. Es gibt keinen Build-Schritt und kein `npm install`.

### Technische Entscheidungen

- **Keine ES-Module:** Die Skripte werden als klassische `<script>`-Tags geladen, weil Browser ES-Module über `file://` blockieren. `calc.js` registriert sich im Browser als `window.MeetingCost` und exportiert in Node über `module.exports`.
- **Keine Persistenz:** Das ist so gewollt. Bitte keinen Speicher (`localStorage`, Cookies, Backend) einbauen, ohne das vorher abzustimmen.
- **Ticker per `setInterval` (50 ms) statt `requestAnimationFrame`:** So läuft die Anzeige auch dann weiter, wenn das Fenster per Bildschirmfreigabe geteilt wird und nicht im Vordergrund ist.
- **Sprache:** Oberfläche und Code-Kommentare sind auf Deutsch. Zahlen und Uhrzeiten werden über `Intl` im Format `de-DE` angezeigt.

### Datenmodell

Der gesamte Zustand liegt in einem Objekt in `app.js`:

```js
state = {
  phase: 'setup' | 'running' | 'stopped',
  startedAt,      // Zeitstempel (ms) des Meetingbeginns
  endedAt,        // Zeitstempel des Stopps
  participants: [ // ein Eintrag pro Zeile, ggf. mit Anzahl > 1
    { id, name, count, rate, joinedAt, leftAt }
  ],
}
```

- `rate` ist der Stundensatz **pro Person**.
- `joinedAt === null` heißt „seit Meetingbeginn dabei“ (gilt für alle, die vor dem Start eingetragen werden).
- `leftAt === null` heißt „noch dabei“. Wer während des Meetings entfernt wird, behält seinen Eintrag mit gesetztem `leftAt`. Vor dem Start wird ein Eintrag dagegen ganz gelöscht.

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
const C = require("./calc.js");
const H = 3600000;
const p = { rate: 60, count: 2, joinedAt: null, leftAt: null };
console.log(C.participantCost(p, 0, H)); // 120
console.log(C.formatDuration(3723000));  // 1:02:03
'
```

Oberfläche und Abläufe bitte manuell im Browser prüfen: Start ab jetzt und mit vergangener Startzeit, Personen während des Meetings hinzufügen und entfernen, Stopp, Präsentationsmodus, schmale Fensterbreite und Dark Mode.

### Bekannte Einschränkungen und Ideen

- Die Startzeit ist eine Uhrzeit **von heute**; Meetings über Mitternacht werden nicht unterstützt.
- Für Personen, die später dazukommen, gibt es nur „jetzt“ oder „Meetingbeginn“, keine frei wählbare Uhrzeit.
- Eine Pause-Funktion fehlt.
- Die Währung ändert nur die Anzeige; Stundensätze werden nicht umgerechnet.
- Automatisierte Tests (z. B. mit `node:test`) gibt es noch nicht.

## Lizenz

Noch keine Lizenz festgelegt. Ohne Lizenzdatei gilt das Urheberrecht des Autors, und andere dürfen den Code nicht ohne Weiteres nutzen oder verändern. Wenn das Projekt offen weiterentwickelt werden soll, eine `LICENSE`-Datei ergänzen (z. B. MIT).
