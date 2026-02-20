<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <strong>Italiano</strong> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.svg" alt="Logo ai-music-sheets" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  Spartiti per pianoforte in formato ibrido JSON + linguaggio musicale — progettati per essere letti, analizzati e utilizzati nell'insegnamento dai LLM.<br/>
  Ora con una pipeline di importazione MIDI: inserisci un file <code>.mid</code> + scrivi una configurazione → ottieni un SongEntry completo.
</p>

[![Tests](https://img.shields.io/badge/tests-113_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10_built--in-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## Che cos'è?

Una libreria TypeScript di brani per pianoforte in un formato ibrido a tre livelli:

1. **Metadati** — JSON strutturato (genere, tonalità, tempo, difficoltà, compositore)
2. **Linguaggio musicale** — descrizioni leggibili per il ragionamento dei LLM (struttura, momenti chiave, obiettivi didattici, consigli stilistici)
3. **Pronto per il codice** — dati delle note misura per misura per la riproduzione MIDI o l'analisi

Un LLM può leggere il blocco `musicalLanguage` per spiegare un brano a uno studente, e poi utilizzare l'array `measures` per pilotare la riproduzione MIDI o generare esercizi.

### Pipeline di importazione MIDI

Espandere la libreria è ora semplicissimo:

1. Inserisci un file `.mid` in `songs/raw/`
2. Scrivi una breve configurazione JSON in `songs/config/` (metadati + linguaggio musicale)
3. Esegui `pnpm build:songs`
4. Il convertitore estrae le note, suddivide le misure, separa le mani, rileva gli accordi e produce un `SongEntry` completo

Il file MIDI è la fonte di verità per le note e il timing. Gli esseri umani scrivono solo il livello LLM ad alto valore.

## Installazione

```bash
npm install @mcptoolshop/ai-music-sheets
```

## Avvio rapido

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "@mcptoolshop/ai-music-sheets";

// Ottenere le statistiche
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// Trovare un brano
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// Cercare
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// Combinare i filtri
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

### Conversione MIDI → SongEntry

```typescript
import { readFileSync } from "node:fs";
import { midiToSongEntry, SongConfigSchema } from "@mcptoolshop/ai-music-sheets";

// Leggere il file MIDI
const midi = new Uint8Array(readFileSync("songs/raw/autumn-leaves.mid"));

// Leggere e validare la configurazione
const rawConfig = JSON.parse(readFileSync("songs/config/autumn-leaves.json", "utf8"));
const config = SongConfigSchema.parse(rawConfig);

// Convertire
const entry = midiToSongEntry(midi, config);
console.log(`${entry.title}: ${entry.measures.length} measures`);
```

## Libreria dei brani (10 brani, 10 generi)

| Genere | Brano | Compositore | Difficoltà | Misure |
|--------|-------|-------------|------------|--------|
| Classical | Moonlight Sonata, Mvt. 1 | Beethoven | Intermediate | 8 |
| Jazz | Autumn Leaves | Kosma | Intermediate | 8 |
| Pop | Let It Be | Lennon/McCartney | Beginner | 8 |
| Blues | 12-Bar Blues in C | Traditional | Beginner | 12 |
| Rock | Dream On (Intro) | Tyler | Intermediate | 8 |
| R&B | Ain't No Sunshine | Withers | Beginner | 8 |
| Latin | Bossa Nova Basic | Traditional | Intermediate | 8 |
| Film | The Entertainer | Joplin | Intermediate | 8 |
| Ragtime | Maple Leaf Rag (A) | Joplin | Advanced | 8 |
| New Age | River Flows in You | Yiruma | Intermediate | 8 |

## Formato ibrido

Ogni voce di brano contiene tre livelli:

```typescript
interface SongEntry {
  // Livello 1: Metadati
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // Livello 2: Linguaggio musicale (per i LLM)
  musicalLanguage: {
    description: string;     // Di cosa tratta questo brano
    structure: string;       // "ABA", "12-bar blues", ecc.
    keyMoments: string[];    // Momenti notevoli da citare nell'insegnamento
    teachingGoals: string[]; // Cosa imparerà lo studente
    styleTips: string[];     // Suggerimenti per l'interpretazione
  };

  // Livello 3: Pronto per il codice (per la riproduzione)
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q" (notazione scientifica + durata)
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // Nota didattica per misura
    dynamics?: string;     // "pp", "mf", "crescendo"
  }>;
}
```

### Formato delle note

Le note utilizzano la notazione scientifica dell'altezza con durata inline:

| Simbolo | Durata | Esempio |
|---------|--------|---------|
| `:w` | Semibreve | `C4:w` |
| `:h.` | Minima con punto | `E4:h.` |
| `:h` | Minima | `E4:h` |
| `:q.` | Semiminima con punto | `G4:q.` |
| `:q` | Semiminima | `G4:q` |
| `:e.` | Croma con punto | `A4:e.` |
| `:e` | Croma | `A4:e` |
| `:s` | Semicroma | `B4:s` |
| `R` | Pausa | `R:h` |

Gli accordi sono separati da spazi: `"C4 E4 G4:q"`

## API del registro

```typescript
// Consultazione
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// Ricerca
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// Statistiche
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// Validazione
validateSong(song: SongEntry): string[]  // restituisce messaggi di errore
validateRegistry(): void                  // lancia un'eccezione se i dati non sono validi

// Registrazione (per aggiungere brani personalizzati)
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## API di importazione MIDI

```typescript
// Convertire buffer MIDI + configurazione → SongEntry
midiToSongEntry(midiBuffer: Uint8Array, config: SongConfig): SongEntry

// Convertire numero di nota MIDI → notazione scientifica
midiNoteToScientific(noteNumber: number): string
// 60 → "C4", 69 → "A4", 108 → "C8"

// Validare una configurazione di brano
validateConfig(config: unknown): ConfigError[]

// Schema Zod per la validazione a runtime
SongConfigSchema    // configurazione completa del brano
MusicalLanguageSchema
MeasureOverrideSchema
```

## Aggiungere brani

### Da MIDI (consigliato)

1. Inserisci il file `.mid` in `songs/raw/<slug>.mid`
2. Scrivi la configurazione in `songs/config/<slug>.json`:

```json
{
  "id": "autumn-leaves",
  "title": "Autumn Leaves",
  "genre": "jazz",
  "composer": "Joseph Kosma",
  "difficulty": "intermediate",
  "key": "G major",
  "tags": ["jazz-standard", "chord-changes"],
  "musicalLanguage": {
    "description": "The quintessential jazz standard...",
    "structure": "AABA",
    "keyMoments": ["m1: Opening ii-V-I progression"],
    "teachingGoals": ["Learn ii-V-I voice leading"],
    "styleTips": ["Swing eighths, gentle touch"]
  }
}
```

3. Esegui `pnpm build:songs` — genera TypeScript in `songs/generated/`
4. Esegui `pnpm test` — la validazione rileva automaticamente i dati errati

### Manuale (legacy)

1. Crea `src/songs/<genre>/<slug>.ts`
2. Esporta un oggetto `SongEntry`
3. Importa e aggiungi in `src/songs/index.ts`
4. Esegui `pnpm test`

## Architettura

```
songs/
├── raw/              file .mid (fonte di verità per le note)
├── config/           configurazioni .json (metadati scritti dagli esseri umani)
└── generated/        file .ts (oggetti SongEntry generati automaticamente)

src/
├── config/
│   └── schema.ts     Schema Zod + validazione
├── midi/
│   └── ingest.ts     convertitore MIDI → SongEntry
├── registry/
│   └── index.ts      ricerca, consultazione e validazione dei brani
├── songs/
│   └── *.ts          10 brani demo integrati
├── types.ts          Tipi principali (SongEntry, Measure, ecc.)
└── index.ts          Esportazioni barrel
```

## Correlati

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Pianista con motore audio integrato. Server MCP + CLI che carica questa libreria, riproduce i brani tramite gli altoparlanti con canto e feedback didattico in tempo reale.

## Sviluppo

```bash
pnpm install
pnpm test          # 113 test
pnpm typecheck     # tsc --noEmit
pnpm build         # compilare in dist/
pnpm build:songs   # generatore MIDI → SongEntry
```

## Licenza

MIT
