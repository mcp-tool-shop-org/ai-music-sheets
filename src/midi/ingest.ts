// ─── MIDI → SongEntry Converter ──────────────────────────────────────────────
//
// Parses a standard MIDI file and merges it with a human-authored SongConfig
// to produce a complete SongEntry ready for the registry.
//
// The MIDI provides: notes, timing, duration, structure.
// The config provides: metadata, musical language, teaching notes, fingering.
// ─────────────────────────────────────────────────────────────────────────────

import { parseMidi, type MidiData, type MidiEvent } from "midi-file";
import type { SongEntry, Measure } from "../types.js";
import type { SongConfig } from "../config/schema.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SPLIT_POINT = 60; // Middle C (C4)
const DEFAULT_TEMPO = 120;      // BPM
const DEFAULT_TIME_SIG = { numerator: 4, denominator: 4 };

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

/** A resolved note with absolute timing. */
interface ResolvedNote {
  /** MIDI note number 0-127. */
  noteNumber: number;
  /** Start time in ticks from the beginning. */
  startTick: number;
  /** Duration in ticks. */
  durationTicks: number;
  /** Velocity 0-127. */
  velocity: number;
  /** MIDI channel. */
  channel: number;
}

/** A tempo change event with absolute tick position. */
interface TempoEvent {
  tick: number;
  microsecondsPerBeat: number;
}

/** A time signature event with absolute tick position. */
interface TimeSigEvent {
  tick: number;
  numerator: number;
  denominator: number;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Convert a MIDI buffer + human-authored config into a complete SongEntry.
 *
 * @param midiBuffer - Raw MIDI file bytes (Buffer or Uint8Array)
 * @param config - Human-authored song config (metadata, musical language, etc.)
 * @returns A complete SongEntry ready for the registry
 */
export function midiToSongEntry(
  midiBuffer: Uint8Array,
  config: SongConfig,
): SongEntry {
  const midi = parseMidi(midiBuffer);
  const ticksPerBeat = midi.header.ticksPerBeat ?? 480;
  const splitPoint = config.splitPoint ?? DEFAULT_SPLIT_POINT;

  // 1. Collect tempo + time signature events across all tracks
  const tempoEvents = extractTempoEvents(midi);
  const timeSigEvents = extractTimeSigEvents(midi);

  // 2. Resolve all notes to absolute ticks + durations
  const notes = resolveNotes(midi);

  // 3. Determine effective tempo and time signature
  const effectiveTempo = config.tempo ?? tempoFromEvents(tempoEvents);
  const effectiveTimeSig = timeSigFromEvents(timeSigEvents, config.timeSignature);

  // 4. Compute ticks per measure
  const ticksPerMeasure = ticksPerBeat * effectiveTimeSig.numerator *
    (4 / effectiveTimeSig.denominator);

  // 5. Determine total measures
  const lastNoteTick = notes.length > 0
    ? Math.max(...notes.map(n => n.startTick + n.durationTicks))
    : 0;
  const totalMeasures = Math.max(1, Math.ceil(lastNoteTick / ticksPerMeasure));

  // 6. Slice notes into measures and separate hands
  const measures = buildMeasures(
    notes, totalMeasures, ticksPerMeasure, ticksPerBeat, splitPoint, config,
  );

  // 7. Compute duration in seconds
  const durationSeconds = ticksToSeconds(lastNoteTick, tempoEvents, ticksPerBeat);

  return {
    id: config.id,
    title: config.title,
    genre: config.genre,
    composer: config.composer,
    arranger: config.arranger,
    difficulty: config.difficulty,
    key: config.key,
    tempo: effectiveTempo,
    timeSignature: `${effectiveTimeSig.numerator}/${effectiveTimeSig.denominator}`,
    durationSeconds: Math.round(durationSeconds),
    musicalLanguage: config.musicalLanguage,
    measures,
    tags: config.tags,
    source: config.source,
  };
}

// ─── MIDI Note Name Conversion ───────────────────────────────────────────────

/**
 * Convert a MIDI note number to scientific pitch notation.
 * 60 → "C4", 69 → "A4", 48 → "C3"
 */
export function midiNoteToScientific(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1;
  const name = NOTE_NAMES[noteNumber % 12];
  return `${name}${octave}`;
}

// ─── Internal: Extract Events ────────────────────────────────────────────────

function extractTempoEvents(midi: MidiData): TempoEvent[] {
  const events: TempoEvent[] = [];
  for (const track of midi.tracks) {
    let tick = 0;
    for (const event of track) {
      tick += event.deltaTime;
      if (event.type === "setTempo") {
        events.push({ tick, microsecondsPerBeat: event.microsecondsPerBeat });
      }
    }
  }
  events.sort((a, b) => a.tick - b.tick);
  return events;
}

function extractTimeSigEvents(midi: MidiData): TimeSigEvent[] {
  const events: TimeSigEvent[] = [];
  for (const track of midi.tracks) {
    let tick = 0;
    for (const event of track) {
      tick += event.deltaTime;
      if (event.type === "timeSignature") {
        events.push({
          tick,
          numerator: event.numerator,
          denominator: Math.pow(2, event.denominator),
        });
      }
    }
  }
  events.sort((a, b) => a.tick - b.tick);
  return events;
}

/** Get the initial or most common tempo from MIDI events. */
function tempoFromEvents(events: TempoEvent[]): number {
  if (events.length === 0) return DEFAULT_TEMPO;
  // Use the first tempo event
  return Math.round(60_000_000 / events[0].microsecondsPerBeat);
}

/** Get time signature from config string or MIDI events. */
function timeSigFromEvents(
  events: TimeSigEvent[],
  configTimeSig?: string,
): { numerator: number; denominator: number } {
  if (configTimeSig) {
    const parts = configTimeSig.split("/").map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
      return { numerator: parts[0], denominator: parts[1] };
    }
  }
  if (events.length > 0) {
    return { numerator: events[0].numerator, denominator: events[0].denominator };
  }
  return DEFAULT_TIME_SIG;
}

// ─── Internal: Resolve Notes ─────────────────────────────────────────────────

/** Flatten all tracks into resolved notes with absolute tick positions. */
function resolveNotes(midi: MidiData): ResolvedNote[] {
  const notes: ResolvedNote[] = [];

  for (const track of midi.tracks) {
    let tick = 0;
    // Track pending noteOn events: key = `channel:noteNumber`
    const pending = new Map<string, { startTick: number; velocity: number; channel: number; noteNumber: number }>();

    for (const event of track) {
      tick += event.deltaTime;

      if (event.type === "noteOn" && event.velocity > 0) {
        const key = `${event.channel}:${event.noteNumber}`;
        pending.set(key, {
          startTick: tick,
          velocity: event.velocity,
          channel: event.channel,
          noteNumber: event.noteNumber,
        });
      } else if (
        event.type === "noteOff" ||
        (event.type === "noteOn" && event.velocity === 0)
      ) {
        const key = `${event.channel}:${event.noteNumber}`;
        const start = pending.get(key);
        if (start) {
          notes.push({
            noteNumber: start.noteNumber,
            startTick: start.startTick,
            durationTicks: tick - start.startTick,
            velocity: start.velocity,
            channel: start.channel,
          });
          pending.delete(key);
        }
      }
    }
  }

  notes.sort((a, b) => a.startTick - b.startTick || a.noteNumber - b.noteNumber);
  return notes;
}

// ─── Internal: Build Measures ────────────────────────────────────────────────

/** Convert ticks duration to a note duration suffix. */
function ticksToDuration(ticks: number, ticksPerBeat: number): string {
  const ratio = ticks / ticksPerBeat;

  // Common durations (with tolerance for quantization)
  if (Math.abs(ratio - 4) < 0.1) return "w";      // whole
  if (Math.abs(ratio - 3) < 0.1) return "h.";     // dotted half
  if (Math.abs(ratio - 2) < 0.1) return "h";      // half
  if (Math.abs(ratio - 1.5) < 0.1) return "q.";   // dotted quarter
  if (Math.abs(ratio - 1) < 0.1) return "q";      // quarter
  if (Math.abs(ratio - 0.75) < 0.1) return "e.";  // dotted eighth
  if (Math.abs(ratio - 0.5) < 0.1) return "e";    // eighth
  if (Math.abs(ratio - 0.25) < 0.1) return "s";   // sixteenth

  // Fallback: closest standard duration
  if (ratio >= 3) return "w";
  if (ratio >= 1.5) return "h";
  if (ratio >= 0.75) return "q";
  if (ratio >= 0.375) return "e";
  return "s";
}

/** Format a note as scientific notation with duration suffix. */
function formatNote(note: ResolvedNote, ticksPerBeat: number): string {
  const name = midiNoteToScientific(note.noteNumber);
  const dur = ticksToDuration(note.durationTicks, ticksPerBeat);
  return `${name}:${dur}`;
}

/**
 * Group simultaneous notes (within a small tick window) into chords.
 * Returns groups of notes that start at roughly the same tick.
 */
function groupIntoChords(notes: ResolvedNote[], tolerance: number = 10): ResolvedNote[][] {
  if (notes.length === 0) return [];

  const groups: ResolvedNote[][] = [];
  let current: ResolvedNote[] = [notes[0]];

  for (let i = 1; i < notes.length; i++) {
    if (notes[i].startTick - current[0].startTick <= tolerance) {
      current.push(notes[i]);
    } else {
      groups.push(current);
      current = [notes[i]];
    }
  }
  groups.push(current);
  return groups;
}

/** Convert a chord group to the string representation. */
function chordToString(chord: ResolvedNote[], ticksPerBeat: number): string {
  if (chord.length === 1) return formatNote(chord[0], ticksPerBeat);

  // For chords, use the duration of the longest note
  const maxDur = Math.max(...chord.map(n => n.durationTicks));
  const dur = ticksToDuration(maxDur, ticksPerBeat);
  const noteNames = chord
    .sort((a, b) => a.noteNumber - b.noteNumber)
    .map(n => midiNoteToScientific(n.noteNumber))
    .join(" ");
  return `${noteNames}:${dur}`;
}

/** Build the measures array from resolved notes. */
function buildMeasures(
  notes: ResolvedNote[],
  totalMeasures: number,
  ticksPerMeasure: number,
  ticksPerBeat: number,
  splitPoint: number,
  config: SongConfig,
): Measure[] {
  const measures: Measure[] = [];

  // Build an override lookup
  const overrides = new Map<number, NonNullable<SongConfig["measureOverrides"]>[number]>();
  if (config.measureOverrides) {
    for (const ov of config.measureOverrides) {
      overrides.set(ov.measure, ov);
    }
  }

  for (let m = 0; m < totalMeasures; m++) {
    const measureStart = m * ticksPerMeasure;
    const measureEnd = (m + 1) * ticksPerMeasure;
    const measureNum = m + 1;

    // Get notes that start within this measure
    const measureNotes = notes.filter(
      n => n.startTick >= measureStart && n.startTick < measureEnd,
    );

    // Split into right hand (>= split point) and left hand (< split point)
    const rhNotes = measureNotes.filter(n => n.noteNumber >= splitPoint);
    const lhNotes = measureNotes.filter(n => n.noteNumber < splitPoint);

    // Group into chords and format
    const rhChords = groupIntoChords(rhNotes);
    const lhChords = groupIntoChords(lhNotes);

    const rightHand = rhChords.length > 0
      ? rhChords.map(c => chordToString(c, ticksPerBeat)).join(" ")
      : "R:w";
    const leftHand = lhChords.length > 0
      ? lhChords.map(c => chordToString(c, ticksPerBeat)).join(" ")
      : "R:w";

    // Apply overrides
    const ov = overrides.get(measureNum);

    const measure: Measure = {
      number: measureNum,
      rightHand,
      leftHand,
    };

    if (ov?.fingering) measure.fingering = ov.fingering;
    if (ov?.teachingNote) measure.teachingNote = ov.teachingNote;
    if (ov?.dynamics) measure.dynamics = ov.dynamics;
    if (ov?.tempoOverride) measure.tempoOverride = ov.tempoOverride;

    measures.push(measure);
  }

  return measures;
}

// ─── Internal: Tick-to-Time Conversion ───────────────────────────────────────

/** Convert a tick position to seconds, respecting tempo changes. */
function ticksToSeconds(
  targetTick: number,
  tempoEvents: TempoEvent[],
  ticksPerBeat: number,
): number {
  let seconds = 0;
  let currentTick = 0;
  let microsecondsPerBeat = tempoEvents.length > 0
    ? tempoEvents[0].microsecondsPerBeat
    : 500_000; // 120 BPM default

  for (const event of tempoEvents) {
    if (event.tick >= targetTick) break;

    if (event.tick > currentTick) {
      const deltaTicks = event.tick - currentTick;
      seconds += (deltaTicks / ticksPerBeat) * (microsecondsPerBeat / 1_000_000);
      currentTick = event.tick;
    }
    microsecondsPerBeat = event.microsecondsPerBeat;
  }

  // Remaining ticks after last tempo change
  if (currentTick < targetTick) {
    const deltaTicks = targetTick - currentTick;
    seconds += (deltaTicks / ticksPerBeat) * (microsecondsPerBeat / 1_000_000);
  }

  return seconds;
}
