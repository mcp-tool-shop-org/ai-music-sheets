<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <strong>中文</strong> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.svg" alt="ai-music-sheets 标志" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  混合 JSON + 音乐语言格式的钢琴乐谱 — 专为 LLM 阅读、推理和教学而设计。<br/>
  现已支持 MIDI 导入流水线：放入 <code>.mid</code> 文件并编写配置 → 生成完整的 SongEntry。
</p>

[![Tests](https://img.shields.io/badge/tests-113_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10_built--in-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## 这是什么？

一个使用三层混合格式的钢琴曲 TypeScript 库：

1. **元数据** — 结构化 JSON（流派、调性、速度、难度、作曲家）
2. **音乐语言** — 供 LLM 推理的人类可读描述（结构、关键时刻、教学目标、风格提示）
3. **代码就绪** — 逐小节的音符数据，用于 MIDI 播放或分析

LLM 可以读取 `musicalLanguage` 块来向学生讲解一首曲子，然后使用 `measures` 数组来驱动 MIDI 播放或生成练习。

### MIDI 导入流水线

扩充曲库现在变得非常简单：

1. 将 `.mid` 文件放入 `songs/raw/`
2. 在 `songs/config/` 中编写一个简短的 JSON 配置（元数据 + 音乐语言）
3. 运行 `pnpm build:songs`
4. 转换器会自动提取音符、切分小节、分离左右手、检测和弦，并生成完整的 `SongEntry`

MIDI 文件是音符和时间信息的唯一来源。人工只需编写高价值的 LLM 层内容。

## 安装

```bash
npm install @mcptoolshop/ai-music-sheets
```

## 快速开始

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "@mcptoolshop/ai-music-sheets";

// 获取统计信息
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// 查找曲目
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// 搜索
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// 组合筛选
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

### MIDI → SongEntry 转换

```typescript
import { readFileSync } from "node:fs";
import { midiToSongEntry, SongConfigSchema } from "@mcptoolshop/ai-music-sheets";

// 读取 MIDI 文件
const midi = new Uint8Array(readFileSync("songs/raw/autumn-leaves.mid"));

// 读取并验证配置
const rawConfig = JSON.parse(readFileSync("songs/config/autumn-leaves.json", "utf8"));
const config = SongConfigSchema.parse(rawConfig);

// 转换
const entry = midiToSongEntry(midi, config);
console.log(`${entry.title}: ${entry.measures.length} measures`);
```

## 曲目库（10 首内置曲目，10 种流派）

| 流派 | 曲名 | 作曲家 | 难度 | 小节数 |
|------|------|--------|------|--------|
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

## 混合格式

每个曲目条目包含三个层次：

```typescript
interface SongEntry {
  // 第一层：元数据
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // 第二层：音乐语言（供 LLM 使用）
  musicalLanguage: {
    description: string;     // 这首曲子的内容
    structure: string;       // "ABA"、"12-bar blues" 等
    keyMoments: string[];    // 教学时值得参考的精彩时刻
    teachingGoals: string[]; // 学生将学到什么
    styleTips: string[];     // 演奏提示
  };

  // 第三层：代码就绪（用于播放）
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q"（科学音高记谱法 + 时值）
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // 逐小节教学备注
    dynamics?: string;     // "pp"、"mf"、"crescendo"
  }>;
}
```

### 音符格式

音符使用科学音高记谱法配合内联时值：

| 符号 | 时值 | 示例 |
|------|------|------|
| `:w` | 全音符 | `C4:w` |
| `:h.` | 附点二分音符 | `E4:h.` |
| `:h` | 二分音符 | `E4:h` |
| `:q.` | 附点四分音符 | `G4:q.` |
| `:q` | 四分音符 | `G4:q` |
| `:e.` | 附点八分音符 | `A4:e.` |
| `:e` | 八分音符 | `A4:e` |
| `:s` | 十六分音符 | `B4:s` |
| `R` | 休止符 | `R:h` |

和弦用空格分隔：`"C4 E4 G4:q"`

## 注册表 API

```typescript
// 查找
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// 搜索
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// 统计
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// 验证
validateSong(song: SongEntry): string[]  // 返回错误信息
validateRegistry(): void                  // 数据无效时抛出异常

// 注册（用于添加自定义曲目）
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## MIDI 导入 API

```typescript
// 将 MIDI 缓冲区 + 配置转换为 SongEntry
midiToSongEntry(midiBuffer: Uint8Array, config: SongConfig): SongEntry

// 将 MIDI 音符编号转换为科学音高
midiNoteToScientific(noteNumber: number): string
// 60 → "C4", 69 → "A4", 108 → "C8"

// 验证曲目配置
validateConfig(config: unknown): ConfigError[]

// 用于运行时验证的 Zod schema
SongConfigSchema    // 完整曲目配置
MusicalLanguageSchema
MeasureOverrideSchema
```

## 添加曲目

### 从 MIDI 导入（推荐）

1. 将 `.mid` 文件放入 `songs/raw/<slug>.mid`
2. 在 `songs/config/<slug>.json` 中编写配置：

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

3. 运行 `pnpm build:songs` — 在 `songs/generated/` 中生成 TypeScript 文件
4. 运行 `pnpm test` — 验证会自动捕获错误数据

### 手动添加（旧方式）

1. 创建 `src/songs/<genre>/<slug>.ts`
2. 导出一个 `SongEntry` 对象
3. 在 `src/songs/index.ts` 中导入并添加
4. 运行 `pnpm test`

## 项目架构

```
songs/
├── raw/              .mid 文件（音符信息的唯一来源）
├── config/           .json 配置（人工编写的元数据）
└── generated/        .ts 文件（自动生成的 SongEntry 对象）

src/
├── config/
│   └── schema.ts     Zod schema + 验证
├── midi/
│   └── ingest.ts     MIDI → SongEntry 转换器
├── registry/
│   └── index.ts      曲目查找、搜索、验证
├── songs/
│   └── *.ts          10 首内置示例曲目
├── types.ts          核心类型（SongEntry、Measure 等）
└── index.ts          导出汇总
```

## 相关项目

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — 内置音频引擎的钢琴播放器。MCP 服务器 + CLI，加载本库并通过扬声器播放曲目，支持演唱和实时教学反馈。

## 开发

```bash
pnpm install
pnpm test          # 113 个测试
pnpm typecheck     # tsc --noEmit
pnpm build         # 编译到 dist/
pnpm build:songs   # MIDI → SongEntry 生成器
```

## 许可证

MIT
