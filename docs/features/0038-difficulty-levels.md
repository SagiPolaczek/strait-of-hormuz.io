# Feature: Difficulty Levels

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-02

## Problem

The game has a single fixed difficulty tuned for experienced players. New players get overwhelmed — missiles start flying and swarms arrive before they've learned the mechanics. Skilled players blow through the early game on autopilot. There's no way to tailor the experience to the player's skill level. This hurts both accessibility (new players bounce) and retention (experts get bored).

## Proposal

Four selectable difficulty levels that modify AI aggression, economy balance, and timing thresholds. Chosen before each run on the pre-game screen. Higher difficulties grant score multipliers for leaderboard ranking.

## Design

### Gameplay Mechanics

**Four difficulty levels:**

| Difficulty | Name | Score Multiplier | Target Audience |
|-----------|------|-----------------|-----------------|
| 🟢 | CADET | 0.5x | First-timers, casual players |
| 🟡 | OFFICER | 1.0x | Default, the current balance |
| 🔴 | COMMANDER | 1.5x | Experienced players |
| ⚫ | ADMIRAL | 2.5x | Hardcore, mastery-level |

**Parameter modifications per difficulty:**

| Parameter | CADET | OFFICER | COMMANDER | ADMIRAL |
|-----------|-------|---------|-----------|---------|
| Starting oil | 2000 | 1500 | 1200 | 1000 |
| IRGC starting oil | 500 | 800 | 1000 | 1200 |
| AI tick interval | 5s | 3s | 2.5s | 2s |
| IRGC oil rig rate | 1.5/s | 3/s | 4/s | 5/s |
| Mine start time | 3 min | 2 min | 1.5 min | 1 min |
| Advanced unlock time | 4 min | 3 min | 2.5 min | 2 min |
| Fast boat start | 4 min | 3 min | 2 min | 1.5 min |
| Fast boat base count | 3 | 5 | 7 | 10 |
| Submarine start | 6 min | 5 min | 4 min | 3 min |
| Missile launcher damage | 35 | 50 | 60 | 75 |
| Balance drift rate | 0.7x | 1.0x | 1.3x | 1.6x |
| Tanker bonus oil | 600 | 500 | 400 | 350 |
| Escalation speed | 0.7x | 1.0x | 1.3x | 1.8x |
| Coalition unit HP | 1.2x | 1.0x | 1.0x | 0.9x |

**CADET mode extras:**
- Tutorial hints appear during gameplay ("Tip: Click oil rigs to collect fuel")
- Slower balance meter drift (more forgiving)
- IRGC launchers have longer cooldowns
- First mine wave is only 1 mine instead of 2
- Grace period extended to 20s (from 10s)

**ADMIRAL mode extras:**
- IRGC gets a free launcher at game start
- Cruise missiles spawn in pairs
- UAV swarms are 3 instead of 2
- Trump events are 50% more frequent
- No grace period for game over check

### Selection Flow

1. Player enters callsign (or auto-loads existing)
2. **Difficulty selection screen** appears:
   ```
   ┌──────────────────────────────────────────────┐
   │        SELECT OPERATIONAL CLEARANCE           │
   │                                               │
   │  🟢 CADET        Recommended for new recruits │
   │                   Score: 0.5x                 │
   │                                               │
   │  🟡 OFFICER      Standard deployment ★        │
   │                   Score: 1.0x                 │
   │                                               │
   │  🔴 COMMANDER    For seasoned admirals        │
   │                   Score: 1.5x                 │
   │                                               │
   │  ⚫ ADMIRAL      Maximum threat level         │
   │                   Score: 2.5x                 │
   │                                               │
   │  Last played: OFFICER                         │
   └──────────────────────────────────────────────┘
   ```
3. Last-selected difficulty saved in localStorage
4. ★ marks the recommended/default option
5. ADMIRAL only available after reaching rank 5 (Commander) or 1 victory on COMMANDER

### Visual Design

- Difficulty screen matches the military briefing aesthetic (dark background, green/amber text, scanlines)
- Each difficulty is a clickable card with color-coded left border
- Selected difficulty has a bright border + "SELECTED" badge
- Score multiplier prominently shown on each card
- HUD shows current difficulty icon in the corner during gameplay
- Debrief card shows difficulty badge + multiplier
- Leaderboard entries tagged with difficulty level

### Balance

- OFFICER is identical to the current game — existing balance is the baseline
- CADET should let a first-timer survive 5+ minutes consistently
- COMMANDER should halve the average survival time compared to OFFICER
- ADMIRAL should make victory rare even for skilled players
- Score multipliers ensure harder difficulties always rank higher on leaderboard
- Difficulty stacks with skulls (0036): total multiplier = difficulty_mult × skull_mult

## Scope

### In Scope
- [ ] Difficulty configuration object (multipliers per difficulty)
- [ ] Difficulty selection screen (pre-game flow)
- [ ] Apply difficulty modifiers to game constants at scene creation
- [ ] Save last-selected difficulty (localStorage)
- [ ] Score multiplier applied to final score
- [ ] Difficulty display in HUD and debrief
- [ ] ADMIRAL unlock gating (requires rank 5 or COMMANDER victory)

### Out of Scope
- Adaptive difficulty (auto-adjusting based on performance)
- Difficulty-specific enemy types or units
- Different maps per difficulty
- Changing difficulty mid-run

## Dependencies
- Constants system — difficulty modifies values in constants.js at runtime
- Pre-game flow — needs a screen between callsign and game start
- Leaderboard (0034) — for difficulty-tagged scores
- Rank system (0031) — for ADMIRAL unlock gating

## Risks
- **Parameter tuning**: Each difficulty is 14+ parameters. Initial values are estimates — needs playtesting.
- **CADET too easy**: If players never feel challenged on CADET, they won't graduate to OFFICER. Include a "Ready for more? Try OFFICER" prompt after CADET victories.
- **ADMIRAL too frustrating**: The unlock gate (rank 5 or COMMANDER victory) ensures only invested players attempt it.
- **Leaderboard fragmentation**: Different difficulties on the same leaderboard is fine because score multipliers handle ranking. Alternatively, separate leaderboards per difficulty could be added later.

## Alternatives Considered
- **Single adaptive difficulty**: Less transparent, players can't control it. Explicit levels give agency and bragging rights.
- **Only 3 levels (Easy/Normal/Hard)**: 4 levels provides better granularity. CADET for accessibility, ADMIRAL for mastery.
- **Difficulty as a slider (0-100)**: Too many options, impossible to balance. Discrete levels are easier to tune and discuss.
