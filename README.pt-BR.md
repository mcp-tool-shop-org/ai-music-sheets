<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <strong>Português</strong>
</p>

<p align="center">
  <img src="logo.svg" alt="PianoAI logo" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  Partituras de piano em formato híbrido JSON + linguagem musical — projetadas para que LLMs leiam, raciocinem e ensinem a partir delas.
</p>

[![Tests](https://img.shields.io/badge/tests-34_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## O que é isso?

Uma biblioteca TypeScript de músicas para piano em um formato híbrido de três camadas:

1. **Metadados** — JSON estruturado (gênero, tonalidade, andamento, dificuldade, compositor)
2. **Linguagem musical** — descrições legíveis para o raciocínio de LLMs (estrutura, momentos-chave, objetivos de ensino, dicas de estilo)
3. **Pronto para código** — dados de notas compasso a compasso para reprodução MIDI ou análise

Um LLM pode ler o bloco `musicalLanguage` para explicar uma música a um aluno e, em seguida, usar o array `measures` para conduzir a reprodução MIDI ou gerar exercícios.

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
| `:h` | Mínima | `E4:h` |
| `:q` | Semínima | `G4:q` |
| `:e` | Colcheia | `A4:e` |
| `:s` | Semicolcheia | `B4:s` |
| `R` | Pausa | `R:h` |

Acordes são separados por espaços: `"C4:q E4:q G4:q"`

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

## Adicionando músicas

1. Criar `src/songs/<genre>/<slug>.ts`
2. Exportar um objeto `SongEntry`
3. Importar e adicionar em `src/songs/index.ts`
4. Executar `pnpm test` — a validação detecta dados incorretos automaticamente

## Relacionados

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Servidor MCP + CLI que carrega esta biblioteca, reproduz músicas pelo VMPK via MIDI e oferece uma experiência de ensino ao vivo com feedback por voz.

## Desenvolvimento

```bash
pnpm install
pnpm test          # 34 testes
pnpm typecheck     # tsc --noEmit
pnpm build         # compilar para dist/
```

## Licença

MIT
