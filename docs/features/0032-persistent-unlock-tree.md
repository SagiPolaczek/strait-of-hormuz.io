# Feature: Persistent Unlock Tree

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-02

## Problem

There's no meta-progression between runs. A player on their 50th game starts in the exact same position as a first-timer. This kills long-term retention — once you've "seen everything" (all unit types, all enemy types), there's no mechanical reason to keep playing.

## Proposal

A persistent unlock tree where players spend **Command Points** (earned per run) to unlock permanent starting bonuses, new abilities, and cosmetic upgrades. Small edges that reward veterans while keeping the core challenge intact.

## Design

### Gameplay Mechanics

- **Command Points (CP)** earned per run:
  - Base: 5 CP per run
  - +1 CP per tanker scored
  - +2 CP per minute survived
  - +5 CP for victory
  - +3 CP for first run of the day
- **Unlock categories**:

**Economy Branch:**
| Unlock | CP Cost | Effect |
|--------|---------|--------|
| Fuel Reserves I | 10 | +200 starting oil |
| Fuel Reserves II | 25 | +400 starting oil |
| Efficient Drilling | 20 | Oil rigs produce 10% faster |
| Bulk Discount | 30 | All unit costs -5% |
| Oil Magnate | 50 | Rig max storage +25% |

**Military Branch:**
| Unlock | CP Cost | Effect |
|--------|---------|--------|
| Reinforced Hulls | 15 | All ships +10% HP |
| Veteran Crews | 25 | Destroyers fire 10% faster |
| Early Warning | 20 | Mines visible at 50% greater distance |
| Quick Deploy | 35 | Ships spawn 15% faster |
| Iron Dome | 50 | Air Defense +15% range |

**Intel Branch:**
| Unlock | CP Cost | Effect |
|--------|---------|--------|
| Recon Satellite | 15 | Start with partial fog of war revealed |
| Signal Intel | 25 | Enemy HP bars always visible |
| Pre-Strike | 40 | First IRGC launcher spawns 30s later |
| Deep Sonar | 30 | Submarine sonar range +20% |

- Unlocks stored in localStorage (key: `hormuz_unlocks`)
- Accessible from a "COMMAND CENTER" button on the callsign/title screen
- Unlocks are permanent — once bought, always active

### Visual Design

- Tech tree displayed as a military organizational chart with branching paths
- Locked nodes are darkened with a padlock
- Unlocked nodes glow with faction blue
- Purchasing animation: stamp effect with "APPROVED" watermark
- CP balance shown prominently at top of unlock screen
- Each unlock shows a brief tooltip explaining the effect

### Balance

- A full tree clear should take ~80-100 runs
- Individual unlocks provide 5-15% edges — noticeable but not game-breaking
- Economy branch unlocks first (cheap) to hook players early
- Military branch has the strongest combat effects (expensive)
- No unlock should trivialize any part of the game

## Scope

### In Scope
- [ ] Command Point earning + tracking system
- [ ] Unlock tree data structure + localStorage persistence
- [ ] Unlock screen UI (accessible from title/callsign screen)
- [ ] Apply unlocks to game systems at scene creation
- [ ] 15-20 unlockable nodes across 3 branches
- [ ] Purchase confirmation + animation

### Out of Scope
- Respec / refund of spent CP
- Unlock tree affecting IRGC / AI difficulty
- Server-side CP validation
- Seasonal resets

## Dependencies
- Rank system (0031) — could share the debrief XP/CP display
- Game config (constants.js) — unlocks modify starting values

## Risks
- **Power creep**: A fully-unlocked player is ~15-20% stronger. This is intentional but needs to not trivialize the early game. Escalation timeline already handles difficulty scaling.
- **New player vs veteran gap**: Since it's single-player, this is a feature not a bug — veterans earned their edge.
- **Complexity**: 15-20 nodes is the sweet spot. More than 30 becomes overwhelming.

## Alternatives Considered
- **Random roguelike unlocks per run**: Doesn't provide persistent progression feeling. Players want to CHOOSE their build.
- **Unlocks tied to achievements only**: Too binary — either you have it or you don't. CP spending gives granular progression.
