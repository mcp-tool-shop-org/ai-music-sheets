<p align="center">
  <a href="README.md">English</a> | <strong>日本語</strong> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.svg" alt="ai-music-sheets ロゴ" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  ピアノ楽譜をハイブリッド JSON + 音楽言語フォーマットで提供 — LLM が読み取り、推論し、教育に活用できるように設計されています。<br/>
  MIDI 取り込みパイプライン搭載：<code>.mid</code> ファイルを配置してコンフィグを書くだけで、完全な SongEntry が生成されます。
</p>

[![Tests](https://img.shields.io/badge/tests-113_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10_built--in-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## これは何ですか？

3層ハイブリッドフォーマットによるピアノ楽曲の TypeScript ライブラリです：

1. **メタデータ** — 構造化 JSON（ジャンル、調、テンポ、難易度、作曲者）
2. **音楽言語** — LLM の推論のための人間が読める説明（構成、重要な場面、教育目標、演奏のヒント）
3. **コード対応** — MIDI 再生や分析のための小節ごとの音符データ

LLM は `musicalLanguage` ブロックを読んで生徒に楽曲を説明し、`measures` 配列を使って MIDI 再生や練習問題の生成を行うことができます。

### MIDI 取り込みパイプライン

ライブラリの拡張が簡単になりました：

1. `.mid` ファイルを `songs/raw/` に配置する
2. `songs/config/` に短い JSON コンフィグを書く（メタデータ + 音楽言語）
3. `pnpm build:songs` を実行する
4. コンバーターが音符の抽出、小節の分割、手のパートの分離、和音の検出を行い、完全な `SongEntry` を生成する

MIDI ファイルが音符とタイミングの正しい情報源です。人間が書くのは高価値な LLM レイヤーのみです。

## インストール

```bash
npm install @mcptoolshop/ai-music-sheets
```

## クイックスタート

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "@mcptoolshop/ai-music-sheets";

// 統計情報を取得
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// 曲を検索
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// 検索
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// フィルターの組み合わせ
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

### MIDI → SongEntry 変換

```typescript
import { readFileSync } from "node:fs";
import { midiToSongEntry, SongConfigSchema } from "@mcptoolshop/ai-music-sheets";

// MIDI ファイルを読み込む
const midi = new Uint8Array(readFileSync("songs/raw/autumn-leaves.mid"));

// コンフィグを読み込んでバリデーション
const rawConfig = JSON.parse(readFileSync("songs/config/autumn-leaves.json", "utf8"));
const config = SongConfigSchema.parse(rawConfig);

// 変換
const entry = midiToSongEntry(midi, config);
console.log(`${entry.title}: ${entry.measures.length} measures`);
```

## 楽曲ライブラリ（10曲、10ジャンル）

| ジャンル | 曲名 | 作曲者 | 難易度 | 小節数 |
|---------|------|--------|--------|--------|
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

## ハイブリッドフォーマット

各楽曲エントリには3つの層が含まれています：

```typescript
interface SongEntry {
  // 第1層：メタデータ
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // 第2層：音楽言語（LLM 向け）
  musicalLanguage: {
    description: string;     // この曲について
    structure: string;       // "ABA"、"12-bar blues" など
    keyMoments: string[];    // 教える際に参照すべき注目ポイント
    teachingGoals: string[]; // 生徒が学ぶこと
    styleTips: string[];     // 演奏のヒント
  };

  // 第3層：コード対応（再生用）
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q"（科学的音高表記 + 音価）
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // 小節ごとの教育メモ
    dynamics?: string;     // "pp"、"mf"、"crescendo"
  }>;
}
```

### 音符フォーマット

音符は科学的音高表記とインライン音価を使用します：

| 記号 | 音価 | 例 |
|------|------|-----|
| `:w` | 全音符 | `C4:w` |
| `:h.` | 付点2分音符 | `E4:h.` |
| `:h` | 2分音符 | `E4:h` |
| `:q.` | 付点4分音符 | `G4:q.` |
| `:q` | 4分音符 | `G4:q` |
| `:e.` | 付点8分音符 | `A4:e.` |
| `:e` | 8分音符 | `A4:e` |
| `:s` | 16分音符 | `B4:s` |
| `R` | 休符 | `R:h` |

和音はスペース区切りです：`"C4 E4 G4:q"`

## レジストリ API

```typescript
// 検索
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// 検索
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// 統計
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// バリデーション
validateSong(song: SongEntry): string[]  // エラーメッセージを返す
validateRegistry(): void                  // 無効なデータの場合にスロー

// 登録（カスタム楽曲の追加用）
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## MIDI 取り込み API

```typescript
// MIDI バッファ + コンフィグ → SongEntry に変換
midiToSongEntry(midiBuffer: Uint8Array, config: SongConfig): SongEntry

// MIDI ノート番号 → 科学的音高表記に変換
midiNoteToScientific(noteNumber: number): string
// 60 → "C4", 69 → "A4", 108 → "C8"

// 楽曲コンフィグをバリデーション
validateConfig(config: unknown): ConfigError[]

// ランタイムバリデーション用 Zod スキーマ
SongConfigSchema    // 楽曲コンフィグ全体
MusicalLanguageSchema
MeasureOverrideSchema
```

## 楽曲の追加方法

### MIDI から（推奨）

1. `.mid` ファイルを `songs/raw/<slug>.mid` に配置する
2. `songs/config/<slug>.json` にコンフィグを書く：

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

3. `pnpm build:songs` を実行 — `songs/generated/` に TypeScript が生成されます
4. `pnpm test` を実行 — バリデーションが不正なデータを自動検出します

### 手動（レガシー）

1. `src/songs/<genre>/<slug>.ts` を作成する
2. `SongEntry` オブジェクトをエクスポートする
3. `src/songs/index.ts` にインポートして追加する
4. `pnpm test` を実行する

## アーキテクチャ

```
songs/
├── raw/              .mid ファイル（音符の正しい情報源）
├── config/           .json コンフィグ（人間が作成するメタデータ）
└── generated/        .ts ファイル（自動生成された SongEntry オブジェクト）

src/
├── config/
│   └── schema.ts     Zod スキーマ + バリデーション
├── midi/
│   └── ingest.ts     MIDI → SongEntry コンバーター
├── registry/
│   └── index.ts      楽曲の検索・検索・バリデーション
├── songs/
│   └── *.ts          10曲の組み込みデモ楽曲
├── types.ts          コア型定義（SongEntry、Measure など）
└── index.ts          バレルエクスポート
```

## 関連プロジェクト

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — 組み込みオーディオエンジン搭載のピアノプレイヤー。このライブラリを読み込み、スピーカーで楽曲を再生し、歌声とライブ教育フィードバックを提供する MCP サーバー + CLI。

## 開発

```bash
pnpm install
pnpm test          # 113 テスト
pnpm typecheck     # tsc --noEmit
pnpm build         # dist/ にコンパイル
pnpm build:songs   # MIDI → SongEntry ジェネレーター
```

## ライセンス

MIT
