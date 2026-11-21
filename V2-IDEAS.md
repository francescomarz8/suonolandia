# Suonolandia V2 — ideas from brainstorming

## 21 Nov 2026 — Dice (agreed: build this next)

**Priority:** the user wants this to be the next thing built.

Refines backlog 6.1 and 6.3, and replaces 6.2.

- **Two dice, small and big, side by side in one corner of Ritmo.** Small die = "a little different" (changes a few cells). Big die = "all new". The size tells the difference, so nothing needs reading. (6.1, S)
- **Musical rolls, not truly random cells.** Each row rolls from a small set of good shapes: kick on the beat with an occasional extra, snare on 2 and 4 with a rare ghost note, hats spread evenly, melody moving by small steps on Magia notes, and the voice row dropping a clip on one or two strong beats. Every roll must sound like a groove.
- **Every roll goes on the undo stack.**
- **Big die moment:** a shake animation and a short drum fill as it lands.
- **"Warm" small die (optional, about +1 hour):** tapping it several times in a row changes a bit more each time, sliding from a small change towards all new.
- **Lock = sleeping animal.** Instead of a padlock, tap a row's animal face to put it to sleep; sleeping rows are not changed by the dice. Use the same idea later for mute in the DJ room (5.7). (6.3, S)
- **Drop 6.2 (a die on each row):** seven extra buttons would clutter Ritmo; the sleeping-animal lock does the same job in reverse.
- Rejected alternative: one die with tap = small change and hold/shake = all new. Hold gestures are hard for kids to discover, and shake doesn't exist on the folded laptop.

## 21 Nov 2026 — Glowing pentatonic and a harder-to-trigger Magia (future, not next)

**Priority:** backlog for later, after the dice.

- **Glow hint on the screen keyboard (Tastiera).** Every key always plays. The five notes of a pentatonic glow softly, with the home note a little brighter. A nudge, never a rule. (S, reuses the Magia scales)
- **The song picks the key, not the child.** The glowing pentatonic is worked out from the notes already used in the song (melody row, notes written with Scrivi). A new, empty song starts with a random key.
- **The glow never shifts while the child is playing.** It updates only between loops or when the song changes, so the keyboard doesn't seem to move under their fingers.
- **Happy / sad = major / minor pentatonic over the same root.** Ties into Magia moods (2.6).
- Screen only: the MPK can't light up; Magia per player (10.9) covers the real keyboard.

**Change how Magia is switched on.** Today (`v2/js/keys.js`, `#magic` in `v2/index.html`) Magia is a one-tap toggle, **on by default**, and works by disabling the black keys. Proposed:

- **Off by default.** Children play any key.
- **Switching it on takes effort:** a long press (about 1.5 s) on a magic wand 🪄. The wand shakes harder and a ring fills while you hold it. Letting go early does nothing. When it completes: a sparkle burst and a chime.
- **While Magia is on,** a few sparkles drift over the keyboard, so you can see the mode is active.
- **Magia snaps to the glowing pentatonic** (any root), instead of "no black keys", so glow and Magia always agree.
- **Switching it off is a single tap** (freeing the keys is never harmful; the glow stays as a hint).

## 21 Nov 2026 — Ideas from other kids' music toys and apps (research)

Looked at: Dato Duo, Dato Drum, Blipblox / Blipblox MyTracks, Pocket Operators, Toca Band, Incredibox, Chrome Music Lab (Kandinsky, Song Maker), Kapu Bloom Tunes, Loopimal, Hape DJ Mix & Spin.

**New ideas**

| Idea | From | Fits | Size |
|---|---|---|---|
| **Paint a melody:** drag a finger across the melody row and the line becomes notes (up = higher), snapped to the song's pentatonic. Replaces most of 6.6 "melody shapes" buttons with one gesture. | Kandinsky, Kapu Bloom Tunes | Ritmo, melody row | S |
| **Star spot:** in the band (9.1), drag one animal onto a spotlight; it plays solo on the keys while the others keep going, filtered to the scale so solos always sound good. Same idea can be the Duo "solo" (10.10). | Toca Band | 9.1, 10.10 | M |
| **Secret combos:** certain combinations (e.g. all drum rows plus a voice clip, or a full rainbow on the melody row) trigger a surprise animation and a short musical flourish. A reward without words; children discover them by playing. | Incredibox | 9.x | S–M |
| **Pitch per drum row:** drag up or down on a row's animal to make that drum higher or lower (small, big). | Dato Drum (pitch slider per voice) | Ritmo | S |
| **Slide (glide) toggle** on Tastiera, shown as a playground slide icon. | Dato Duo (slide icon for glide) | Tastiera | S |
| **Let it play by itself:** a "listen" mode that keeps evolving the song endlessly, for a calm break or bedtime. Merge with Evolve mode (6.7). | Incredibox auto mode | Ritmo | S |

**What the research confirms in the existing plan**

- Pentatonic keyboard as the default "always sounds good" (Dato Duo) — supports the glowing pentatonic idea.
- No printed labels was "the single biggest design decision" for Blipblox; icons like a tunnel for delay and an elephant for loud on Dato Duo — supports rule 1.
- Parent volume limiter (Blipblox) — already in the parent corner.
- Randomize button and chunky levers are what kids reach for first (Blipblox MyTracks) — supports the dice.
- Punch-in effects that last only while held (Pocket Operator) — supports 3.4.
- A tempo slider next to a record for scratching (Hape DJ toy) — a simple model for the DJ room.
- Household-object sounds (Melody Jams) — supports the kitchen kit in 2.4.

## 21 Nov 2026 — Approved for V2: build order

The user approved **all** the ideas in this file for V2 ("I love all of these, let's implement them in the v2"). Suggested build order, smallest and most connected first:

1. Two dice with musical rolls + sleeping-animal lock (S + S)
2. Paint a melody on the melody row (S) — reuses the dice's note shapes
3. Pitch per drum row (S) and the Slide toggle on Tastiera (S)
4. Glowing pentatonic + new Magia (off by default, long press on a shaking wand) (S)
5. "Listen" mode merged with Evolve (6.7) (S)
6. Secret combos (S–M)
7. Star spot (M) — needs the animal band (9.1) first
