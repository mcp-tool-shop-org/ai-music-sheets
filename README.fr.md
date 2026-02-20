<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <strong>Français</strong> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="logo.svg" alt="Logo ai-music-sheets" width="180" />
</p>

<h1 align="center">ai-music-sheets</h1>

<p align="center">
  Partitions de piano au format hybride JSON + langage musical — conçues pour que les LLM puissent les lire, raisonner et enseigner à partir d'elles.<br/>
  Désormais avec un pipeline d'ingestion MIDI : déposez un fichier <code>.mid</code> + écrivez une config → obtenez un SongEntry complet.
</p>

[![Tests](https://img.shields.io/badge/tests-113_passing-brightgreen)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Songs](https://img.shields.io/badge/songs-10_built--in-blue)](https://github.com/mcp-tool-shop-org/ai-music-sheets)
[![Genres](https://img.shields.io/badge/genres-10-purple)](https://github.com/mcp-tool-shop-org/ai-music-sheets)

## Qu'est-ce que c'est ?

Une bibliothèque TypeScript de morceaux de piano dans un format hybride à trois couches :

1. **Métadonnées** — JSON structuré (genre, tonalité, tempo, difficulté, compositeur)
2. **Langage musical** — descriptions lisibles pour le raisonnement des LLM (structure, moments clés, objectifs pédagogiques, conseils de style)
3. **Prêt pour le code** — données de notes mesure par mesure pour la lecture MIDI ou l'analyse

Un LLM peut lire le bloc `musicalLanguage` pour expliquer un morceau à un élève, puis utiliser le tableau `measures` pour piloter la lecture MIDI ou générer des exercices.

### Pipeline d'ingestion MIDI

Enrichir la bibliothèque est désormais trivial :

1. Déposez un fichier `.mid` dans `songs/raw/`
2. Écrivez une courte config JSON dans `songs/config/` (métadonnées + langage musical)
3. Exécutez `pnpm build:songs`
4. Le convertisseur extrait les notes, découpe les mesures, sépare les mains, détecte les accords et produit un `SongEntry` complet

Le fichier MIDI fait foi pour les notes et le timing. Les humains n'écrivent que la couche LLM à haute valeur ajoutée.

## Installation

```bash
npm install @mcptoolshop/ai-music-sheets
```

## Démarrage rapide

```typescript
import {
  getAllSongs,
  searchSongs,
  getSong,
  getStats,
} from "@mcptoolshop/ai-music-sheets";

// Obtenir les statistiques
const stats = getStats();
// → { totalSongs: 10, byGenre: { classical: 1, jazz: 1, ... }, totalMeasures: 82 }

// Trouver un morceau
const moonlight = getSong("moonlight-sonata-mvt1");
console.log(moonlight.musicalLanguage.description);
// → "The famous opening of Beethoven's 'Moonlight' Sonata..."

// Rechercher
const beginnerSongs = searchSongs({ difficulty: "beginner" });
const jazzSongs = searchSongs({ genre: "jazz" });
const arpeggioSongs = searchSongs({ query: "arpeggios" });

// Combiner les filtres
const easyBlues = searchSongs({ genre: "blues", difficulty: "beginner" });
```

### Conversion MIDI → SongEntry

```typescript
import { readFileSync } from "node:fs";
import { midiToSongEntry, SongConfigSchema } from "@mcptoolshop/ai-music-sheets";

// Lire le fichier MIDI
const midi = new Uint8Array(readFileSync("songs/raw/autumn-leaves.mid"));

// Lire + valider la config
const rawConfig = JSON.parse(readFileSync("songs/config/autumn-leaves.json", "utf8"));
const config = SongConfigSchema.parse(rawConfig);

// Convertir
const entry = midiToSongEntry(midi, config);
console.log(`${entry.title}: ${entry.measures.length} measures`);
```

## Bibliothèque de morceaux (10 morceaux intégrés, 10 genres)

| Genre | Morceau | Compositeur | Difficulté | Mesures |
|-------|---------|-------------|------------|---------|
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

## Format hybride

Chaque entrée de morceau contient trois couches :

```typescript
interface SongEntry {
  // Couche 1 : Métadonnées
  id: string;           // "moonlight-sonata-mvt1"
  title: string;        // "Moonlight Sonata, Mvt. 1"
  genre: Genre;         // "classical"
  difficulty: Difficulty; // "intermediate"
  key: string;          // "C# minor"
  tempo: number;        // 56
  timeSignature: string; // "4/4"

  // Couche 2 : Langage musical (pour les LLM)
  musicalLanguage: {
    description: string;     // De quoi parle ce morceau
    structure: string;       // "ABA", "12-bar blues", etc.
    keyMoments: string[];    // Moments remarquables à mentionner lors de l'enseignement
    teachingGoals: string[]; // Ce que l'élève apprendra
    styleTips: string[];     // Conseils d'interprétation
  };

  // Couche 3 : Prêt pour le code (pour la lecture)
  measures: Array<{
    number: number;
    rightHand: string;     // "C4:q E4:q G4:q" (notation scientifique + durée)
    leftHand: string;      // "C3:h"
    fingering?: string;    // "RH: 1-3-5, LH: 5-3-1"
    teachingNote?: string; // Note pédagogique par mesure
    dynamics?: string;     // "pp", "mf", "crescendo"
  }>;
}
```

### Format des notes

Les notes utilisent la notation scientifique des hauteurs avec la durée en ligne :

| Symbole | Durée | Exemple |
|---------|-------|---------|
| `:w` | Ronde | `C4:w` |
| `:h.` | Blanche pointée | `E4:h.` |
| `:h` | Blanche | `E4:h` |
| `:q.` | Noire pointée | `G4:q.` |
| `:q` | Noire | `G4:q` |
| `:e.` | Croche pointée | `A4:e.` |
| `:e` | Croche | `A4:e` |
| `:s` | Double croche | `B4:s` |
| `R` | Silence | `R:h` |

Les accords sont séparés par des espaces : `"C4 E4 G4:q"`

## API du registre

```typescript
// Consultation
getSong(id: string): SongEntry | undefined
getAllSongs(): SongEntry[]
getSongsByGenre(genre: Genre): SongEntry[]
getSongsByDifficulty(difficulty: Difficulty): SongEntry[]

// Recherche
searchSongs(options: SearchOptions): SongEntry[]
// SearchOptions: { genre?, difficulty?, query?, tags?, maxDuration?, minDuration? }

// Statistiques
getStats(): RegistryStats
// → { totalSongs, byGenre, byDifficulty, totalMeasures }

// Validation
validateSong(song: SongEntry): string[]  // renvoie les messages d'erreur
validateRegistry(): void                  // lance une exception si les données sont invalides

// Enregistrement (pour ajouter des morceaux personnalisés)
registerSong(song: SongEntry): void
registerSongs(songs: SongEntry[]): void
```

## API d'ingestion MIDI

```typescript
// Convertir un buffer MIDI + config → SongEntry
midiToSongEntry(midiBuffer: Uint8Array, config: SongConfig): SongEntry

// Convertir un numéro de note MIDI → notation scientifique
midiNoteToScientific(noteNumber: number): string
// 60 → "C4", 69 → "A4", 108 → "C8"

// Valider une config de morceau
validateConfig(config: unknown): ConfigError[]

// Schémas Zod pour la validation à l'exécution
SongConfigSchema    // config complète du morceau
MusicalLanguageSchema
MeasureOverrideSchema
```

## Ajouter des morceaux

### Depuis un fichier MIDI (recommandé)

1. Placez le fichier `.mid` dans `songs/raw/<slug>.mid`
2. Écrivez la config dans `songs/config/<slug>.json` :

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

3. Exécutez `pnpm build:songs` — génère le TypeScript dans `songs/generated/`
4. Exécutez `pnpm test` — la validation détecte automatiquement les données incorrectes

### Manuel (méthode classique)

1. Créez `src/songs/<genre>/<slug>.ts`
2. Exportez un objet `SongEntry`
3. Importez et ajoutez dans `src/songs/index.ts`
4. Exécutez `pnpm test`

## Architecture

```
songs/
├── raw/              fichiers .mid (source de vérité pour les notes)
├── config/           configs .json (métadonnées rédigées par les humains)
└── generated/        fichiers .ts (objets SongEntry auto-générés)

src/
├── config/
│   └── schema.ts     Schémas Zod + validation
├── midi/
│   └── ingest.ts     Convertisseur MIDI → SongEntry
├── registry/
│   └── index.ts      Consultation, recherche, validation des morceaux
├── songs/
│   └── *.ts          10 morceaux de démonstration intégrés
├── types.ts          Types principaux (SongEntry, Measure, etc.)
└── index.ts          Exports barrel
```

## Projets associés

- **[PianoAI](https://github.com/mcp-tool-shop-org/pianoai)** — Pianiste avec moteur audio intégré. Serveur MCP + CLI qui charge cette bibliothèque et joue les morceaux via les haut-parleurs avec chant et retour pédagogique en direct.

## Développement

```bash
pnpm install
pnpm test          # 113 tests
pnpm typecheck     # tsc --noEmit
pnpm build         # compiler dans dist/
pnpm build:songs   # Générateur MIDI → SongEntry
```

## Licence

MIT
