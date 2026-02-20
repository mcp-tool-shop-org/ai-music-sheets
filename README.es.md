<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <strong>Español</strong> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.svg" alt="PianoAI logo" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  Partituras de piano en formato híbrido JSON + lenguaje musical — diseñadas para que los LLM las lean, razonen y enseñen a partir de ellas.
</p>

[![Tests](https://img.shields.io/badge/tests-34_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## ¿Qué es esto?

Una biblioteca TypeScript de canciones para piano en un formato híbrido de tres capas:

1. **Metadatos** — JSON estructurado (género, tonalidad, tempo, dificultad, compositor)
2. **Lenguaje musical** — descripciones legibles para el razonamiento de LLM (estructura, momentos clave, objetivos de enseñanza, consejos de estilo)
3. **Listo para código** — datos de notas compás por compás para reproducción MIDI o análisis

Un LLM puede leer el bloque `musicalLanguage` para explicar una canción a un estudiante, y luego usar el array `measures` para reproducción MIDI o generación de ejercicios.

## Instalación

```bash
npm install @mcptoolshop/ai-music-sheets
```

## Inicio rápido

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "@mcptoolshop/ai-music-sheets";

// Obtener estadísticas
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// Buscar una canción
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// Buscar
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// Combinar filtros
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

## Biblioteca de canciones (10 canciones, 10 géneros)

| Género | Canción | Compositor | Dificultad | Compases |
|--------|---------|------------|------------|----------|
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

## Formato híbrido

Cada entrada de canción contiene tres capas:

```typescript
interface SongEntry {
  // Capa 1: Metadatos
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // Capa 2: Lenguaje musical (para LLMs)
  musicalLanguage: {
    description: string;     // De qué trata esta pieza
    structure: string;       // "ABA", "12-bar blues", etc.
    keyMoments: string[];    // Momentos notables para referencia en la enseñanza
    teachingGoals: string[]; // Lo que el estudiante aprenderá
    styleTips: string[];     // Consejos de interpretación
  };

  // Capa 3: Listo para código (para reproducción)
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q" (notación científica + duración)
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // Nota pedagógica por compás
    dynamics?: string;     // "pp", "mf", "crescendo"
  }>;
}
```

### Formato de notas

Las notas usan notación científica de altura con duración en línea:

| Símbolo | Duración | Ejemplo |
|---------|----------|---------|
| `:w` | Redonda | `C4:w` |
| `:h` | Blanca | `E4:h` |
| `:q` | Negra | `G4:q` |
| `:e` | Corchea | `A4:e` |
| `:s` | Semicorchea | `B4:s` |
| `R` | Silencio | `R:h` |

Los acordes se separan con espacios: `"C4:q E4:q G4:q"`

## API del registro

```typescript
// Consulta
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// Búsqueda
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// Estadísticas
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// Validación
validateSong(song: SongEntry): string[]  // devuelve mensajes de error
validateRegistry(): void                  // lanza excepción si hay datos inválidos

// Registro (para añadir canciones personalizadas)
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## Añadir canciones

1. Crear `src/songs/<genre>/<slug>.ts`
2. Exportar un objeto `SongEntry`
3. Importar y añadir en `src/songs/index.ts`
4. Ejecutar `pnpm test` — la validación detecta datos incorrectos automáticamente

## Relacionado

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Servidor MCP + CLI que carga esta biblioteca, reproduce canciones a través de VMPK vía MIDI y proporciona una experiencia de enseñanza en vivo con retroalimentación por voz.

## Desarrollo

```bash
pnpm install
pnpm test          # 34 pruebas
pnpm typecheck     # tsc --noEmit
pnpm build         # compilar a dist/
```

## Licencia

MIT
