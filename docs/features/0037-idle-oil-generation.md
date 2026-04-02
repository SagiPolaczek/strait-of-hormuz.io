# Feature: Idle Oil Generation (Comeback Hook)

**Status:** `draft`
**Priority:** `P2`
**Author:** Sagi
**Date:** 2026-04-02

## Problem

There's no reason to return to the game after closing the tab. The game exists only while it's open. Mobile and idle games solve this with offline progression — the knowledge that value is accumulating RIGHT NOW creates a background itch to return. We need a "come back and collect" hook.

## Proposal

Between sessions, the player's oil rigs continue generating oil at a reduced rate. When the player returns, they're greeted with a "Welcome back, Admiral" screen showing how much oil accumulated while they were away. This oil is added to their starting reserves for the next run.

## Design

### Gameplay Mechanics

- **Offline accumulation rate**: 1 oil per rig per minute (much slower than in-game rate of 3/sec)
- **Rig count for offline**: number of rigs the player had at the END of their last run (stored in localStorage)
  - If last run ended in defeat: use the peak rig count from that run
  - If player never played: 0 rigs, 0 offline oil (no free lunch)
- **Maximum offline accumulation**: 500 oil (caps after ~8 hours with 1 rig, ~1 hour with 8 rigs)
- **Oil is BONUS starting oil** — added on top of the normal COALITION_START_OIL (1500)
- **Calculation**:
  ```
  offlineOil = min(500, rigCount * minutesAway * 1)
  ```
- **Stored in localStorage**: `hormuz_offline` = { lastPlayed: timestamp, rigCount: N }

### Visual Design

- **Welcome back screen** (shown before game starts, after callsign):
  ```
  ┌──────────────────────────────────────┐
  │     CENTCOM OPERATIONS REPORT        │
  │                                      │
  │  Welcome back, ADM. IRONCLAD         │
  │                                      │
  │  Your rigs operated for 4h 23m       │
  │  Oil generated: +342 🛢️              │
  │                                      │
  │  ████████████████░░░░ 342/500        │
  │                                      │
  │  Starting reserves: 1,842 oil        │
  │                                      │
  │       [ DEPLOY TO THEATER ]          │
  └──────────────────────────────────────┘
  ```
- Military briefing aesthetic matching boot sequence
- Oil amount counts up with a satisfying ticker animation
- Bar fills up showing how close to the 500 cap
- If at cap: "RESERVES FULL — Deploy to collect!" (urgency to play)
- Skip-able with click/Enter (don't block returning players)

### Balance

- **Max bonus is 500 oil** — roughly one extra destroyer + tanker. Meaningful but not game-changing.
- **Offline rate is ~20x slower** than in-game rate. Idle oil is a bonus, not a replacement for playing.
- **Cap prevents infinite accumulation** — a player who leaves for a week gets the same 500 as someone who leaves for 8 hours.
- **Rig count persists from last run** — incentivizes building rigs (even in losing runs).
- **Does NOT interact with persistent unlocks** — this is purely a session-start bonus.

### Idle Psychology

The magic isn't the oil itself — it's the KNOWLEDGE that oil is accumulating. Players will think about the game when they're not playing: "my rigs are working, I should go collect." This is the #1 mobile retention mechanic and it works just as well in browser games.

## Scope

### In Scope
- [ ] Offline oil tracking (localStorage: timestamp + rig count)
- [ ] Save rig count on game over
- [ ] Calculate accumulated oil on return
- [ ] Welcome back screen with oil ticker animation
- [ ] Apply bonus oil to starting reserves
- [ ] 500 oil cap

### Out of Scope
- Push notifications ("Your reserves are full!")
- Offline combat / defense
- Multiple offline resource types
- Offline oil affecting rank/XP
- Spending offline oil in the unlock tree

## Dependencies
- Economy system — needs to accept a starting oil bonus
- Callsign system — welcome screen shown after callsign validation

## Risks
- **Exploitation**: Player could manipulate system clock to fake time passage. Acceptable for a free browser game — the cap (500) limits the impact.
- **Returning player confusion**: Welcome screen must be clear that this is BONUS oil, not a replacement for gameplay. Show "Starting reserves: 1500 + 342 = 1842".
- **Session flow**: Welcome screen adds one more click before gameplay. Make it skip-able and fast (auto-dismiss after 5 seconds if no interaction).

## Alternatives Considered
- **Offline resource generation without cap**: Too generous — players could accumulate thousands of oil by leaving the game for days.
- **Oil decays while offline (use it or lose it)**: Too punishing — would frustrate casual players who return after a week.
- **Offline oil only for premium/paying users**: No monetization in this game. Everyone gets it.
