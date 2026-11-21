# Suonolandia V2 — backlog

V1 is frozen as tag `v1.0` and stays online at https://francescomarz8.github.io/suonolandia/.
**Status (21 Nov 2026), on branch `v2`:** built and tested with simulated devices — 1.1 rooms, 1.2 modules, 1.3 autosave with recordings, 1.4 song shelf, 1.5 offline, 1.6 export/import, 1.8 parent corner (volume, saves, MIDI), 7.1 8/16 steps, 10.1 test page, 10.2 clock out, 10.3 sound per device (in the parent corner), 10.4 pad learning, 10.6 timing nudge. Not built: 1.7 avatars, play timer, 10.5 knobs and joystick, 10.7 player corners, 10.8–10.11. Not yet tried with the real DrumBrute and MPK.

Sizes: **S** = an evening, **M** = a few sessions, **L** = a real project.
★ = your idea, ＋ = added.

## Rules that keep it a toy for 4–7 year olds

1. One tap makes a sound. Nothing needs reading.
2. It always sounds good: every new sound and effect is tuned so that mashing is pleasant.
3. Nothing is lost by accident: undo or hold-to-delete everywhere.
4. V1 is already a full screen. New features go into separate "rooms", not onto the same screen.

## Decisions to take first

| Decision | Recommendation |
|---|---|
| One screen or rooms? | Four rooms with a big icon each: 🥁 Ritmo, 🎤 Voce, 🎹 Tastiera, 💿 DJ. The rhythm keeps playing while you change room. |
| Stay a single file? | No. Real instrument samples, MP3 export and offline use need extra files. V2 lives at `/v2/`, V1 stays at `/`. |
| Who is V2 for? | Same kids, growing. Keep the simple view as default and unlock extras with a "più grande" switch (a parent sets it). |

## 1. Foundation (do this first)

| # | Item | Size |
|---|---|---|
| 1.1 | ＋ Rooms navigation with a shared transport (play, tempo, undo) | M |
| 1.2 | ＋ Split the single file into modules, V2 published at `/v2/` | M |
| 1.3 | ★ Autosave the project **with recordings** (browser storage on that computer) | M |
| 1.4 | ★ "Le mie canzoni": a shelf of saved songs, each with a colour and an animal instead of a name | M |
| 1.5 | ＋ Works offline and installs as an app (no internet needed after the first visit) | S |
| 1.6 | ＋ Export / import a song as one file, to move it between the Mac and the Windows laptop | S |
| 1.7 | ＋ One avatar per child, each with their own shelf | S |
| 1.8 | ＋ Parent corner (hold to open): max volume, play timer, the "più grande" switch | S |

## 2. Sounds for keyboard and MIDI ★

| # | Item | Size |
|---|---|---|
| 2.1 | More synth sounds: flute, organ, bass, soft pad, marimba, steel drum, video game, laser, cat | M |
| 2.2 | ＋ Real sampled instruments (piano, guitar, xylophone, trumpet) | M |
| 2.3 | ＋ Sound picker as a swipeable row of characters instead of five fixed buttons | S |
| 2.4 | ＋ Drum kits: acoustic, electronic, body sounds, animals, kitchen | M |
| 2.5 | ＋ "My kit": record four sounds with the mic and they become the drum rows | M |
| 2.6 | ＋ Magia moods: happy, sad, spooky, far-away (different scales, still no wrong notes) | S |
| 2.7 | ＋ One finger plays a chord; arpeggio button that ripples the held notes in time | M |
| 2.8 | ＋ MIDI: octave buttons, pitch and mod wheel, knobs mapped to effects, pads mapped to drums | M |
| 2.9 | ＋ Two players: MIDI keyboard on one sound, screen keys on another | S |
| 2.10 | ＋ MIDI out and clock, so it can drive a real synth such as the Dato Duo | M |

## 3. Effects ★

| # | Item | Size |
|---|---|---|
| 3.1 | ＋ Magic pad: drag a finger on a square, left-right and up-down change the sound (filter + echo) | M |
| 3.2 | Places: cave, bathroom, space, underwater, telephone | M |
| 3.3 | Wobble, robot crusher, wah | S |
| 3.4 | ＋ Hold-to-play effects that stop when you let go, so nothing stays broken | S |
| 3.5 | ＋ Choose what the effect touches: keyboard, drums, voice or everything | S |

## 4. Voice effects ★

| # | Item | Size |
|---|---|---|
| 4.1 | Robot, monster, alien, ghost, telephone, canyon echo | M |
| 4.2 | Choir: your voice stacked in harmony | M |
| 4.3 | Slow motion and fast forward without changing pitch | L |
| 4.4 | Stutter (st-st-stutter) and chop into pieces | S |
| 4.5 | ＋ Sing-in-tune: bends the voice onto Magia notes | L |
| 4.6 | ＋ Effects picker as a wheel of faces, stackable two at a time | S |
| 4.7 | ＋ Trim handles on the recording, and longer recordings | S |
| 4.8 | ＋ Record in time: count-in, and the clip snaps to the beat | M |
| 4.9 | ＋ More than four clips, kept on a shelf across sessions (needs 1.3) | S |

## 5. DJ room ★

| # | Item | Size |
|---|---|---|
| 5.1 | Spinning disc that turns with the loop; drag it to scratch the voice clip or the whole loop | L |
| 5.2 | Spin-back and brake (the record slowing to a stop) | M |
| 5.3 | Big filter knob, stutter / beat-repeat buttons (1/2, 1/4, 1/8) | M |
| 5.4 | ＋ "Drop" button: drums vanish, build up, come back | S |
| 5.5 | ＋ One-shot pads: air horn, siren, laser, applause | S |
| 5.6 | ＋ Two decks with a crossfader between two saved songs | L |
| 5.7 | ＋ Mute buttons per row, as big animal faces that fall asleep | S |

## 6. Randomness ★

| # | Item | Size |
|---|---|---|
| 6.1 | Two dice: "a little different" (changes a few cells) and "all new" | S |
| 6.2 | A die on each row | S |
| 6.3 | Padlock on a row so the dice leave it alone | S |
| 6.4 | Style dice with characters: rock, disco, march, lullaby, robot | M |
| 6.5 | "Few ↔ many" slider per row that spreads hits evenly | S |
| 6.6 | Melody shapes: stairs up, stairs down, jumps, echo of what you just played | S |
| 6.7 | Evolve mode: the pattern changes slightly every four loops | S |
| 6.8 | Surprise sounds: random kit and instrument | S |
| 6.9 | ＋ Robot friend: you play a few notes, it answers with a variation | M |

## 7. Song length ★

| # | Item | Size |
|---|---|---|
| 7.1 | 8 or 16 steps switch | S |
| 7.2 | Pages: four coloured blocks (A B C D), each its own pattern; tap to switch live | M |
| 7.3 | Song line: drag blocks into a row to make a longer song | M |
| 7.4 | Copy a page to another, then change it | S |
| 7.5 | ＋ Waltz switch (groups of three) and swing | S |
| 7.6 | ＋ Loop pedal: record what you play on the keys over several loops, layer by layer | L |

## 8. Export ★

| # | Item | Size |
|---|---|---|
| 8.1 | MP3 export of the loop or the whole song line | M |
| 8.2 | ＋ Instant export (rendered in the background, no need to wait while it plays) | M |
| 8.3 | ＋ Record a live performance, including scratches and key playing | S |
| 8.4 | ＋ Song cover picture made from the grid colours, saved with the file | S |

## 9. Play and reward ＋

| # | Item | Size |
|---|---|---|
| 9.1 | A band on stage: each row is an animal that dances when its sound plays | M |
| 9.2 | Missions without words ("wake the elephant", "fill the rainbow") | M |
| 9.3 | Copy-me game: the app plays a rhythm, the child taps it back | M |
| 9.4 | Themes: jungle, space, sea — change colours, characters and sound sets together | L |
| 9.5 | Gamepad or webcam movement as an instrument | L |

## 10. Duo Mode ★ (two children, two instruments)

Setup: Arturia DrumBrute Impact (in USB sync mode) + Akai MPK mini, both on USB. The computer is the conductor.

### How it works

- **The computer sends the beat.** Suonolandia sends MIDI clock (24 ticks per beat) plus Start and Stop to the DrumBrute. Press play on screen and the DrumBrute's own pattern starts on beat one, at the tempo of the 🐢🐇 slider.
- **The DrumBrute makes its own sound.** It is an analog instrument: its drums come out of its own audio jack, not out of the computer. See "Sound" below.
- **Each device is a player.** The browser sees each USB device by name, so every note is routed by where it came from: MPK keys → child A's sound, DrumBrute → child B.
- **Bars line up.** DrumBrute: 16 steps of 1/16. Suonolandia: 8 steps of 1/8. Both are one bar, so they loop together.

### Sound: three ways to hear the DrumBrute

| Option | How | Trade-off |
|---|---|---|
| A. Own speaker (recommended to start) | DrumBrute jack → a small speaker or mixer | Simplest, no delay. Not included in the saved song. |
| B. Into the computer | DrumBrute jack → audio interface / line-in → Suonolandia passes it through | One speaker, and it gets recorded and exported. Adds a little delay; needs an interface. |
| C. As a controller only | Its pads trigger Suonolandia's drum sounds | No extra cable, but you lose the real analog sound and its sequencer. |

### What the research confirmed

- In INT mode the DrumBrute is the master and sends clock on USB; in USB/MIDI/CLK mode it follows the external source and forwards it. Its own transport buttons keep working. Default clock rate is 24 per beat, which is what MIDI clock uses. The sync setting cannot be changed while it is playing. (Arturia manual, p.73–74)
- Its drum sounds can be played by incoming MIDI notes, and it sends and receives MIDI over USB. (manual, p.10)
- A user reports the sync source can fall back to internal ("Auto Sync"); this and the MIDI channel are set in Arturia's MIDI Control Center app.
- Browsers can send precisely timed MIDI: each message takes a timestamp, so clock ticks are scheduled ahead, not fired by a timer.
- Windows 11 is rolling out a new MIDI system in 2026 that lets several apps share one device. On older Windows only one app can hold a device, so close other music apps.

### What could not be confirmed online (check on the real devices)

- Default note numbers and channel of the DrumBrute pads, and whether its sequencer also sends its notes over USB while playing.
- Whether pressing play on screen starts the DrumBrute by itself in USB mode, or its own play button must be armed.
- MPK mini default pad notes, knob numbers and joystick assignment (they depend on which PROG is selected), and whether its arpeggiator can follow external clock.
- Whether both need no driver on Windows (very likely, not confirmed).

Because of this, the plan does not rely on defaults: step 10.1 measures them, and 10.4 lets the app learn them.

### Items

| # | Item | Size |
|---|---|---|
| 10.1 | **Test page first**: shows every message from every device, and has a "send clock" button. Ten minutes with both devices plugged in answers all the open questions above. | S |
| 10.2 | Clock out: ticks, Start, Stop, tempo changes, sent to chosen devices | S |
| 10.3 | "Chi suona?" screen: each plugged device appears as a card; pick a child avatar, a colour and a sound for it. Remembered by device name. | M |
| 10.4 | Learn mode (adult): "hit a pad" / "turn a knob" to assign pads to drums or voice clips and knobs to effects | M |
| 10.5 | MPK mapping: keys → the child's sound; 8 pads → drum kit or voice clips; knobs → filter, echo, wobble, volume; joystick → bend | S |
| 10.6 | Timing nudge (adult): a slider to line up the DrumBrute with the computer's sound, since computer audio is slightly late | S |
| 10.7 | Each child gets a corner of the screen with their avatar that lights up when they play, and their own volume | S |
| 10.8 | DrumBrute audio into the computer (option B), so it is in the saved song and the MP3 | M |
| 10.9 | Magia per player: the MPK child keeps "no wrong notes" even on a real keyboard | S |
| 10.10 | Duo games: "your turn / my turn" lights, copy-me between the two, a solo button | M |
| 10.11 | Works with any other MIDI device too (a third player, the Dato Duo) | S |

### Risks

- **Timing feel.** Clock from a browser is good but not studio-tight; the DrumBrute smooths it. 10.1 will show if it is good enough, and 10.6 fixes a constant offset.
- **DrumBrute sync fallback.** If it drops back to internal clock, it stops following. Fix once in MIDI Control Center.
- **Two sound sources** (option A) means two volumes for an adult to balance.
- **Setup is an adult job.** After the first time, plugging in should be enough.

## Suggested order

0. **Duo test page (10.1)** — tiny, and its answers shape the rest.
1. **V2.0 Foundation + Duo core** — section 1, 7.1, and 10.2–10.7. Nothing is lost any more, and both children can play together.
2. **V2.1 Sounds and voices** — 2.1, 2.3, 2.4, 2.6, 4.1, 4.4, 4.6, 3.2, 3.4.
3. **V2.2 Dice and pages** — 6.1–6.6, 7.2, 7.4, 9.1.
4. **V2.3 DJ room** — 5.1–5.5, 5.7, 3.1.
5. **V2.4 Export** — 8.1–8.3.
6. Later: the L items (4.3, 4.5, 5.6, 7.6, 9.4, 9.5) and MIDI out.

## Risks

- **Clutter.** The list is five times V1. Each release needs a test with the kids before adding the next.
- **Scratching** needs low audio latency; Windows touch laptops vary, so it must be tried on the real one early.
- **Storage.** Recordings saved in the browser are lost if browser data is cleared; 1.6 is the backup.
- **Not a single file any more.** V2 needs the hosted version or the installed app; double-clicking a file will not be enough.
