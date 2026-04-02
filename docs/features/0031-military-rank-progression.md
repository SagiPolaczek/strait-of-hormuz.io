# Feature: Military Rank Progression

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-02

## Problem

Every run is independent — there's no sense of career growth across sessions. Players who lose at 3 minutes and players who've survived 10+ minutes dozens of times both start with the same blank slate. No persistent motivation to keep replaying.

## Proposal

A persistent military rank system based on cumulative career stats. Every run contributes XP toward the next rank. Ranks are displayed on the callsign screen, HUD, leaderboard, and debrief card. Ranks never reset.

## Design

### Gameplay Mechanics

- **XP sources** (per run):
  - Tankers scored: 100 XP each
  - Survival time: 10 XP per minute
  - IRGC units destroyed: 5 XP each
  - Victory bonus: 500 XP
  - First run of the day: 50 XP bonus
- **Rank ladder** (12 ranks):

| Rank | Title | Cumulative XP | Prefix |
|------|-------|--------------|--------|
| 1 | Ensign | 0 | ENS. |
| 2 | Lieutenant JG | 200 | LTJG. |
| 3 | Lieutenant | 600 | LT. |
| 4 | Lt. Commander | 1,500 | LCDR. |
| 5 | Commander | 3,500 | CDR. |
| 6 | Captain | 7,000 | CAPT. |
| 7 | Rear Admiral (Lower) | 12,000 | RDML. |
| 8 | Rear Admiral (Upper) | 20,000 | RADM. |
| 9 | Vice Admiral | 35,000 | VADM. |
| 10 | Admiral | 55,000 | ADM. |
| 11 | Fleet Admiral | 85,000 | FADM. |
| 12 | Supreme Allied Commander | 150,000 | SAC. |

- XP and rank stored in localStorage (key: `hormuz_career`)
- On rank-up: full-screen military promotion ceremony overlay with new insignia

### Visual Design

- Callsign modal: rank insignia + title above callsign input
- HUD: rank abbreviation replaces the current fixed "ADM." prefix
- Debrief card: rank insignia + XP gained this run + progress bar to next rank
- Rank-up animation: gold star burst, "PROMOTED" banner in military style, new rank title reveal with fanfare
- Leaderboard entries show rank insignia beside callsign

### Balance

- Reaching Admiral (~rank 10) should take roughly 30-40 runs for an average player
- Supreme Allied Commander is the prestige rank — requires sustained commitment
- Daily bonus incentivizes returning every day
- Victory bonus is large enough to matter but not so large that losses feel wasted

## Scope

### In Scope
- [ ] Career XP tracking system (localStorage)
- [ ] 12-rank ladder with XP thresholds
- [ ] XP calculation at end of each run
- [ ] Rank display in HUD, callsign modal, debrief
- [ ] Rank-up promotion animation
- [ ] Progress bar to next rank on debrief screen

### Out of Scope
- Server-side XP validation
- Rank decay / demotion
- Rank-specific gameplay unlocks (see 0032 for that)
- Prestige / rank reset system

## Dependencies
- Leaderboard system (0007, shipped)
- Callsign system (0029, shipped)
- Debrief screen (0030, shipped)

## Risks
- **XP inflation**: If values are too generous, players rank up too fast and lose motivation. Tune conservatively — easier to buff than nerf.
- **localStorage limits**: Career data is small (< 1KB), no concern here.
- **Cheating**: localStorage is editable. Acceptable for a free browser game.

## Alternatives Considered
- **Elo-style rating**: Too abstract for a single-player game. Military ranks feel thematic and concrete.
- **Star-based rating per run**: Doesn't provide the persistent career feeling. Stars are per-session, ranks are forever.
