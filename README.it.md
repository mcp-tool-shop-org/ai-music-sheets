<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <strong>Italiano</strong> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.svg" alt="PianoAI logo" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  Spartiti per pianoforte in formato ibrido JSON + linguaggio musicale — progettati per essere letti, analizzati e utilizzati nell'insegnamento dai LLM.
</p>

[![Tests](https://img.shields.io/badge/tests-34_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## Che cos'è?

Una libreria TypeScript di brani per pianoforte in un formato ibrido a tre livelli:

1. **Metadati** — JSON strutturato (genere, tonalità, tempo, difficoltà, compositore)
2. **Linguaggio musicale** — descrizioni leggibili per il ragionamento dei LLM (struttura, momenti chiave, obiettivi didattici, consigli stilistici)
3. **Pronto per il codice** — dati delle note misura per misura per la riproduzione MIDI o l'analisi

Un LLM può leggere il blocco `musicalLanguage` per spiegare un brano a uno studente, e poi utilizzare l'array `measures` per pilotare la riproduzione MIDI o generare esercizi.

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
| `:h` | Minima | `E4:h` |
| `:q` | Semiminima | `G4:q` |
| `:e` | Croma | `A4:e` |
| `:s` | Semicroma | `B4:s` |
| `R` | Pausa | `R:h` |

Gli accordi sono separati da spazi: `"C4:q E4:q G4:q"`

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

## Aggiungere brani

1. Creare `src/songs/<genre>/<slug>.ts`
2. Esportare un oggetto `SongEntry`
3. Importare e aggiungere in `src/songs/index.ts`
4. Eseguire `pnpm test` — la validazione rileva automaticamente i dati errati

## Correlati

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Server MCP + CLI che carica questa libreria, riproduce i brani tramite VMPK via MIDI e offre un'esperienza didattica dal vivo con feedback vocale.

## Sviluppo

```bash
pnpm install
pnpm test          # 34 test
pnpm typecheck     # tsc --noEmit
pnpm build         # compilare in dist/
```

## Licenza

MIT
