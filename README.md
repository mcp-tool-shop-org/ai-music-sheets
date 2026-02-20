# ai-music-sheets

Piano sheet music in hybrid JSON + musical-language format — built for LLMs to read, reason about, and teach from.

[![Tests](https://img.shields.io/badge/tests-34_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## What is this?

A TypeScript library of piano songs in a three-layer hybrid format:

1. **Metadata** — structured JSON (genre, key, tempo, difficulty, composer)
2. **Musical Language** — human-readable descriptions for LLM reasoning (structure, key moments, teaching goals, style tips)
3. **Code-ready** — measure-by-measure note data for MIDI playback or analysis

An LLM can read the `musicalLanguage` block to explain a song to a student, then use the `measures` array to drive MIDI playback or generate exercises.

## Quick Start

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "ai-music-sheets";

// Get stats
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// Find a song
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// Search
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// Combine filters
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

## Song Library (10 songs, 10 genres)

| Genre | Song | Composer | Difficulty | Measures |
|-------|------|----------|------------|----------|
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

## Hybrid Format

Each song entry contains three layers:

```typescript
interface SongEntry {
  // Layer 1: Metadata
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // Layer 2: Musical Language (for LLMs)
  musicalLanguage: {
    description: string;     // What this piece is about
    structure: string;       // "ABA", "12-bar blues", etc.
    keyMoments: string[];    // Notable moments to reference when teaching
    teachingGoals: string[]; // What the student will learn
    styleTips: string[];     // Performance hints
  };

  // Layer 3: Code-ready (for playback)
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q" (scientific pitch + duration)
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // Per-measure teaching note
    dynamics?: string;     // "pp", "mf", "crescendo"
  }>;
}
```

### Note Format

Notes use scientific pitch notation with inline duration:

| Symbol | Duration | Example |
|--------|----------|---------|
| `:w` | Whole note | `C4:w` |
| `:h` | Half note | `E4:h` |
| `:q` | Quarter note | `G4:q` |
| `:e` | Eighth note | `A4:e` |
| `:s` | Sixteenth note | `B4:s` |
| `R` | Rest | `R:h` |

Chords are space-separated: `"C4:q E4:q G4:q"`

## Registry API

```typescript
// Lookup
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// Search
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// Stats
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// Validation
validateSong(song: SongEntry): string[]  // returns error messages
validateRegistry(): void                  // throws on invalid data

// Registration (for adding custom songs)
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## Adding Songs

1. Create `src/songs/<genre>/<slug>.ts`
2. Export a `SongEntry` object
3. Import and add to `src/songs/index.ts`
4. Run `pnpm test` — validation catches bad data automatically

## Related

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — MCP server + CLI that loads this library, plays songs through VMPK via MIDI, and provides a living teaching experience with voice feedback.

## Development

```bash
pnpm install
pnpm test          # 34 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
```

## License

MIT
