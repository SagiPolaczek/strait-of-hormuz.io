# Feature: Pressure Balance Meter (Tug-of-War)

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

The current game has no urgency or tension beyond "don't run out of oil." There's no feeling of a ticking clock or geopolitical stakes. The player can turtle indefinitely with oil rigs and never feel pressure to actually send tankers through the strait. The game needs a "heartbeat" — a constant tension that forces action.

## Proposal

A prominent **Balance Meter** (tug-of-war bar) sits on screen showing the geopolitical balance of power in the strait. It starts at neutral (center). Over time, IRGC dominance passively pushes it red (down/left). Every tanker that reaches the exit pushes it blue (right/up). The game ends in **victory** when the player pushes the meter fully blue, or in **defeat** when it hits fully red.

This replaces the current "run out of resources" game-over with a much more dramatic win/lose condition.

## Design

### Gameplay Mechanics

- **Meter range**: -100 (IRGC victory) to +100 (Coalition victory), starts at 0
- **Passive IRGC drift**: The meter moves toward red at a constant rate that increases over time
  - 0-2 min: -1 per second
  - 2-5 min: -1.5 per second
  - 5-10 min: -2.5 per second
  - 10+ min: -4 per second
- **Tanker scoring**: Each tanker that reaches the exit pushes the meter toward blue
  - Base tanker: +15 points
  - Could scale with tanker upgrades (if feature 0013 ships)
- **Win condition**: Meter reaches +100 (full blue) — Coalition controls the strait
- **Lose condition**: Meter reaches -100 (full red) — IRGC blockade succeeds
- The old game-over condition (no resources) can remain as a secondary lose trigger

### Visual Design

- **Position**: Vertical bar docked to the RIGHT edge of the screen
- **Appearance**: Military-styled gauge, dark background
  - Blue half (top/right): Coalition control, with wave/flag motifs
  - Red half (bottom/left): IRGC control, with warning patterns
  - Center line: "NEUTRAL" marker
- **Current position indicator**: Bright pip/arrow showing current balance
- **Color bleed**: As the meter shifts, subtle screen-edge vignette tints toward red or blue
- **Urgency effects**:
  - Below -50: Red warning flashes on screen edges, "LOSING CONTROL" text pulses in HUD
  - Above +50: Blue confidence glow, "SECURING STRAIT" text
  - Near -80: Alarm-level red pulse, screen shake hint
  - Near +80: Triumphant blue glow intensifies
- **Tanker score pop**: When a tanker reaches exit, the meter visually lurches toward blue with a satisfying "chunk" animation

### Balance

- At the default passive drift, the player has roughly:
  - ~100 seconds before hitting -100 if they send zero tankers (pure loss at -1/s)
  - In practice, early tankers arrive around 30-40s, so the player needs to be deploying tankers from the start
- A single tanker (+15) offsets ~15 seconds of early-game drift — player needs a steady flow
- To WIN (+100 from 0), player needs ~7 tankers with no drift, but accounting for drift they'll need 12-18+ depending on speed
- Late game drift (-4/s) means the player must have a strong tanker pipeline or they'll lose even from a positive position
- Numbers are all tunable — the key is the FEELING of constant pressure

## Scope

### In Scope
- [ ] Balance meter state management (value, drift rate, tanker scoring)
- [ ] Balance meter UI component (vertical or horizontal bar with military styling)
- [ ] Screen-edge vignette effects based on meter position
- [ ] Urgency text overlays at threshold values
- [ ] Win condition: meter reaches +100 triggers victory screen
- [ ] Lose condition: meter reaches -100 triggers defeat screen
- [ ] Update GameOverScene to distinguish victory vs defeat
- [ ] Tanker scoring animation on the meter

### Out of Scope
- IRGC actions directly affecting the meter (e.g. destroying tankers pushing it red) — keep it simple: passive drift vs tanker delivery
- Multiplayer / competitive balance
- Multiple stages or changing win thresholds

## Dependencies
- GameOverScene needs a victory variant (currently only shows "MISSION TERMINATED")
- HUD needs space for the meter or it needs its own UI layer

## Risks
- **Too punishing early**: If drift is too fast, new players will lose before understanding the mechanic. May need a brief grace period or slower initial drift.
- **Unclear to player**: The meter concept needs to be immediately readable. Consider a brief tooltip or the tutorial feature (0011) explaining it.
- **Conflicts with existing game-over**: Need to reconcile the "no resources" game-over with the meter. Meter should be the primary win/lose; resource exhaustion is a secondary fail-safe.
- **Pacing**: If winning feels too far away, players disengage. If too close, no tension. Needs playtesting.

## Alternatives Considered
- **Timer-based (survive X minutes)**: Less dynamic — player can turtle and wait. No push-pull tension.
- **Score target (get N tankers through)**: Better than timer but no "losing" pressure. The tug-of-war adds the critical "you're falling behind" feeling.
- **Meter affected by combat events**: Considered having IRGC kills push meter red, but this double-punishes the player (lose unit AND lose meter). Passive drift is cleaner.
