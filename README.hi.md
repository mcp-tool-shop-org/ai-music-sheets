<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <strong>हिन्दी</strong> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.svg" alt="ai-music-sheets लोगो" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  हाइब्रिड JSON + संगीत भाषा प्रारूप में पियानो शीट संगीत — LLM द्वारा पढ़ने, तर्क करने और सिखाने के लिए निर्मित।<br/>
  अब MIDI इनजेस्ट पाइपलाइन के साथ: एक <code>.mid</code> फ़ाइल डालें + कॉन्फ़िग लिखें → पूर्ण SongEntry प्राप्त करें।
</p>

[![Tests](https://img.shields.io/badge/tests-113_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10_built--in-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## यह क्या है?

तीन-स्तरीय हाइब्रिड प्रारूप में पियानो गानों की एक TypeScript लाइब्रेरी:

1. **मेटाडेटा** — संरचित JSON (शैली, स्वर, गति, कठिनाई, संगीतकार)
2. **संगीत भाषा** — LLM तर्क के लिए मानव-पठनीय विवरण (संरचना, प्रमुख क्षण, शिक्षण लक्ष्य, शैली सुझाव)
3. **कोड-तैयार** — MIDI प्लेबैक या विश्लेषण के लिए माप-दर-माप नोट डेटा

एक LLM `musicalLanguage` ब्लॉक पढ़कर छात्र को गाना समझा सकता है, फिर MIDI प्लेबैक चलाने या अभ्यास बनाने के लिए `measures` सरणी का उपयोग कर सकता है।

### MIDI इनजेस्ट पाइपलाइन

लाइब्रेरी बढ़ाना अब बेहद आसान है:

1. `songs/raw/` में एक `.mid` फ़ाइल डालें
2. `songs/config/` में एक छोटा JSON कॉन्फ़िग लिखें (मेटाडेटा + संगीत भाषा)
3. `pnpm build:songs` चलाएँ
4. कन्वर्टर नोट्स निकालता है, माप काटता है, हाथ अलग करता है, कॉर्ड पहचानता है और एक पूर्ण `SongEntry` बनाता है

MIDI फ़ाइल नोट्स और टाइमिंग के लिए सत्य का स्रोत है। मनुष्य केवल उच्च-मूल्य LLM परत लिखते हैं।

## इंस्टॉल करें

```bash
npm install @mcptoolshop/ai-music-sheets
```

## त्वरित प्रारंभ

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "@mcptoolshop/ai-music-sheets";

// आँकड़े प्राप्त करें
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// गाना खोजें
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// खोज करें
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// फ़िल्टर संयोजित करें
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

### MIDI → SongEntry रूपांतरण

```typescript
import { readFileSync } from "node:fs";
import { midiToSongEntry, SongConfigSchema } from "@mcptoolshop/ai-music-sheets";

// MIDI फ़ाइल पढ़ें
const midi = new Uint8Array(readFileSync("songs/raw/autumn-leaves.mid"));

// कॉन्फ़िग पढ़ें + सत्यापित करें
const rawConfig = JSON.parse(readFileSync("songs/config/autumn-leaves.json", "utf8"));
const config = SongConfigSchema.parse(rawConfig);

// रूपांतरित करें
const entry = midiToSongEntry(midi, config);
console.log(`${entry.title}: ${entry.measures.length} measures`);
```

## गीत पुस्तकालय (10 अंतर्निहित गाने, 10 शैलियाँ)

| शैली | गाना | संगीतकार | कठिनाई | माप |
|------|------|----------|--------|-----|
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

## हाइब्रिड प्रारूप

प्रत्येक गीत प्रविष्टि में तीन स्तर होते हैं:

```typescript
interface SongEntry {
  // स्तर 1: मेटाडेटा
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // स्तर 2: संगीत भाषा (LLM के लिए)
  musicalLanguage: {
    description: string;     // यह रचना किसके बारे में है
    structure: string;       // "ABA", "12-bar blues", आदि
    keyMoments: string[];    // सिखाते समय संदर्भ के लिए उल्लेखनीय क्षण
    teachingGoals: string[]; // छात्र क्या सीखेगा
    styleTips: string[];     // प्रदर्शन संकेत
  };

  // स्तर 3: कोड-तैयार (प्लेबैक के लिए)
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q" (वैज्ञानिक पिच + अवधि)
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // प्रति-माप शिक्षण नोट
    dynamics?: string;     // "pp", "mf", "crescendo"
  }>;
}
```

### नोट प्रारूप

नोट्स वैज्ञानिक पिच संकेतन के साथ इनलाइन अवधि का उपयोग करते हैं:

| प्रतीक | अवधि | उदाहरण |
|--------|-------|--------|
| `:w` | पूर्ण नोट | `C4:w` |
| `:h.` | बिंदु-सहित अर्ध | `E4:h.` |
| `:h` | अर्ध नोट | `E4:h` |
| `:q.` | बिंदु-सहित चतुर्थांश | `G4:q.` |
| `:q` | चतुर्थांश नोट | `G4:q` |
| `:e.` | बिंदु-सहित अष्टमांश | `A4:e.` |
| `:e` | अष्टमांश नोट | `A4:e` |
| `:s` | षोडशांश नोट | `B4:s` |
| `R` | विराम | `R:h` |

कॉर्ड स्पेस द्वारा अलग किए जाते हैं: `"C4 E4 G4:q"`

## रजिस्ट्री API

```typescript
// लुकअप
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// खोज
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// आँकड़े
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// सत्यापन
validateSong(song: SongEntry): string[]  // त्रुटि संदेश लौटाता है
validateRegistry(): void                  // अमान्य डेटा पर अपवाद फेंकता है

// पंजीकरण (कस्टम गाने जोड़ने के लिए)
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## MIDI इनजेस्ट API

```typescript
// MIDI बफर + कॉन्फ़िग → SongEntry रूपांतरित करें
midiToSongEntry(midiBuffer: Uint8Array, config: SongConfig): SongEntry

// MIDI नोट नंबर → वैज्ञानिक पिच रूपांतरित करें
midiNoteToScientific(noteNumber: number): string
// 60 → "C4", 69 → "A4", 108 → "C8"

// गाने के कॉन्फ़िग को सत्यापित करें
validateConfig(config: unknown): ConfigError[]

// रनटाइम सत्यापन के लिए Zod स्कीमा
SongConfigSchema    // पूर्ण गाने का कॉन्फ़िग
MusicalLanguageSchema
MeasureOverrideSchema
```

## गाने जोड़ना

### MIDI से (अनुशंसित)

1. `songs/raw/<slug>.mid` में `.mid` फ़ाइल रखें
2. `songs/config/<slug>.json` में कॉन्फ़िग लिखें:

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

3. `pnpm build:songs` चलाएँ — `songs/generated/` में TypeScript उत्पन्न करता है
4. `pnpm test` चलाएँ — सत्यापन स्वचालित रूप से गलत डेटा पकड़ता है

### मैन्युअल (पुराना तरीका)

1. `src/songs/<genre>/<slug>.ts` बनाएँ
2. एक `SongEntry` ऑब्जेक्ट एक्सपोर्ट करें
3. `src/songs/index.ts` में इम्पोर्ट करें और जोड़ें
4. `pnpm test` चलाएँ

## आर्किटेक्चर

```
songs/
├── raw/              .mid फ़ाइलें (नोट्स के लिए सत्य का स्रोत)
├── config/           .json कॉन्फ़िग (मानव-लिखित मेटाडेटा)
└── generated/        .ts फ़ाइलें (स्वतः-उत्पन्न SongEntry ऑब्जेक्ट)

src/
├── config/
│   └── schema.ts     Zod स्कीमा + सत्यापन
├── midi/
│   └── ingest.ts     MIDI → SongEntry कन्वर्टर
├── registry/
│   └── index.ts      गाने की लुकअप, खोज, सत्यापन
├── songs/
│   └── *.ts          10 अंतर्निहित डेमो गाने
├── types.ts          मूल प्रकार (SongEntry, Measure, आदि)
└── index.ts          बैरल एक्सपोर्ट
```

## संबंधित

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — अंतर्निहित ऑडियो इंजन के साथ पियानो प्लेयर। MCP सर्वर + CLI जो इस लाइब्रेरी को लोड करता है और गायन तथा जीवंत शिक्षण प्रतिक्रिया के साथ स्पीकर के माध्यम से गाने बजाता है।

## विकास

```bash
pnpm install
pnpm test          # 113 परीक्षण
pnpm typecheck     # tsc --noEmit
pnpm build         # dist/ में संकलित करें
pnpm build:songs   # MIDI → SongEntry जनरेटर
```

## लाइसेंस

MIT
