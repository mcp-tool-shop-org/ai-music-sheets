<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <strong>Português</strong>
</p>

<p align="center">
  <img src="logo.svg" alt="Logo ai-music-sheets" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  Partituras de piano em formato híbrido JSON + linguagem musical — projetadas para que LLMs leiam, raciocinem e ensinem a partir delas.<br/>
  Agora com um pipeline de ingestão MIDI: adicione um arquivo <code>.mid</code> + escreva uma configuração → obtenha um <code>SongEntry</code> completo.
</p>

[![Tests](https://img.shields.io/badge/tests-113_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10_built--in-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## O que é isso?

Uma biblioteca TypeScript de músicas para piano em um formato híbrido de três camadas:

1. **Metadados** — JSON estruturado (gênero, tonalidade, andamento, dificuldade, compositor)
2. **Linguagem musical** — descrições legíveis para o raciocínio de LLMs (estrutura, momentos-chave, objetivos de ensino, dicas de estilo)
3. **Pronto para código** — dados de notas compasso a compasso para reprodução MIDI ou análise

Um LLM pode ler o bloco `musicalLanguage` para explicar uma música a um aluno e, em seguida, usar o array `measures` para conduzir a reprodução MIDI ou gerar exercícios.

### Pipeline de Ingestão MIDI

Expandir a biblioteca agora é simples:

1. Adicione um arquivo `.mid` em `songs/raw/`
2. Escreva uma configuração JSON curta em `songs/config/` (metadados + linguagem musical)
3. Execute `pnpm build:songs`
4. O conversor extrai notas, fatia compassos, separa mãos, detecta acordes e produz um `SongEntry` completo

O arquivo MIDI é a fonte de verdade para notas e tempo. Os humanos escrevem apenas a camada de alto valor para LLMs.

## Instalação

```bash
npm install @mcptoolshop/ai-music-sheets
```

## Início rápido

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "@mcptoolshop/ai-music-sheets";

// Obter estatísticas
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// Encontrar uma música
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// Pesquisar
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// Combinar filtros
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

### Conversão MIDI → SongEntry

```typescript
import { readFileSync } from "node:fs";
import { midiToSongEntry, SongConfigSchema } from "@mcptoolshop/ai-music-sheets";

// Ler arquivo MIDI
const midi = new Uint8Array(readFileSync("songs/raw/autumn-leaves.mid"));

// Ler + validar configuração
const rawConfig = JSON.parse(readFileSync("songs/config/autumn-leaves.json", "utf8"));
const config = SongConfigSchema.parse(rawConfig);

// Converter
const entry = midiToSongEntry(midi, config);
console.log(`${entry.title}: ${entry.measures.length} measures`);
```

## Biblioteca de músicas (10 músicas, 10 gêneros)

| Gênero | Música | Compositor | Dificuldade | Compassos |
|--------|--------|------------|-------------|-----------|
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

Cada entrada de música contém três camadas:

```typescript
interface SongEntry {
  // Camada 1: Metadados
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // Camada 2: Linguagem musical (para LLMs)
  musicalLanguage: {
    description: string;     // Sobre o que trata esta peça
    structure: string;       // "ABA", "12-bar blues", etc.
    keyMoments: string[];    // Momentos notáveis para referência no ensino
    teachingGoals: string[]; // O que o aluno aprenderá
    styleTips: string[];     // Dicas de interpretação
  };

  // Camada 3: Pronto para código (para reprodução)
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q" (notação científica + duração)
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // Nota pedagógica por compasso
    dynamics?: string;     // "pp", "mf", "crescendo"
  }>;
}
```

### Formato das notas

As notas usam notação científica de altura com duração inline:

| Símbolo | Duração | Exemplo |
|---------|---------|---------|
| `:w` | Semibreve | `C4:w` |
| `:h.` | Mínima pontuada | `E4:h.` |
| `:h` | Mínima | `E4:h` |
| `:q.` | Semínima pontuada | `G4:q.` |
| `:q` | Semínima | `G4:q` |
| `:e.` | Colcheia pontuada | `A4:e.` |
| `:e` | Colcheia | `A4:e` |
| `:s` | Semicolcheia | `B4:s` |
| `R` | Pausa | `R:h` |

Acordes são separados por espaços: `"C4 E4 G4:q"`

## API do registro

```typescript
// Consulta
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// Pesquisa
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// Estatísticas
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// Validação
validateSong(song: SongEntry): string[]  // retorna mensagens de erro
validateRegistry(): void                  // lança exceção se os dados forem inválidos

// Registro (para adicionar músicas personalizadas)
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## API de Ingestão MIDI

```typescript
// Converter buffer MIDI + configuração → SongEntry
midiToSongEntry(midiBuffer: Uint8Array, config: SongConfig): SongEntry

// Converter número de nota MIDI → notação científica de altura
midiNoteToScientific(noteNumber: number): string
// 60 → "C4", 69 → "A4", 108 → "C8"

// Validar uma configuração de música
validateConfig(config: unknown): ConfigError[]

// Schemas Zod para validação em tempo de execução
SongConfigSchema    // configuração completa da música
MusicalLanguageSchema
MeasureOverrideSchema
```

## Adicionando músicas

### A partir de MIDI (recomendado)

1. Coloque o arquivo `.mid` em `songs/raw/<slug>.mid`
2. Escreva a configuração em `songs/config/<slug>.json`:

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

3. Execute `pnpm build:songs` — gera TypeScript em `songs/generated/`
4. Execute `pnpm test` — a validação detecta dados incorretos automaticamente

### Manual (legado)

1. Criar `src/songs/<genre>/<slug>.ts`
2. Exportar um objeto `SongEntry`
3. Importar e adicionar em `src/songs/index.ts`
4. Executar `pnpm test`

## Arquitetura

```
songs/
├── raw/              arquivos .mid (fonte de verdade para notas)
├── config/           configurações .json (metadados escritos por humanos)
└── generated/        arquivos .ts (objetos SongEntry gerados automaticamente)

src/
├── config/
│   └── schema.ts     Schemas Zod + validação
├── midi/
│   └── ingest.ts     Conversor MIDI → SongEntry
├── registry/
│   └── index.ts      Consulta, pesquisa e validação de músicas
├── songs/
│   └── *.ts          10 músicas de demonstração integradas
├── types.ts          Tipos principais (SongEntry, Measure, etc.)
└── index.ts          Exportações centralizadas
```

## Relacionados

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Piano player com motor de áudio integrado. Servidor MCP + CLI que carrega esta biblioteca e reproduz músicas pelos alto-falantes com canto e feedback de ensino ao vivo.

## Desenvolvimento

```bash
pnpm install
pnpm test          # 113 testes
pnpm typecheck     # tsc --noEmit
pnpm build         # compilar para dist/
pnpm build:songs   # gerador MIDI → SongEntry
```

## Licença

MIT
