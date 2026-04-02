# Feature: Difficulty Skulls (Modifiers)

**Status:** `draft`
**Priority:** `P2`
**Author:** Sagi
**Date:** 2026-04-02

## Problem

Once a skilled player can consistently win on the default difficulty, there's no additional challenge to chase. The escalation timeline provides within-run difficulty, but there's no way to make the overall game harder for players who've mastered it. Hardcore players need a reason to keep pushing.

## Proposal

Unlockable difficulty modifiers (skulls) that can be stacked for increased challenge and score multipliers. Each skull adds a specific handicap. Up to 5 skulls can be active simultaneously. Score multiplier increases with each active skull, creating leaderboard incentive to play harder.

## Design

### Gameplay Mechanics

- **Unlock condition**: Achieve at least 1 victory to unlock the skull system
- **8 available skulls** (pick up to 5):

| Skull | Name | Effect | Score Mult |
|-------|------|--------|-----------|
| 💀 | Iron Hulls | IRGC missiles deal +50% damage | 1.3x |
| 💀 | Fuel Crisis | Oil rigs produce 30% less | 1.25x |
| 💀 | Disarmed | Air Defense unavailable | 1.4x |
| 💀 | Early Assault | All IRGC timers start 60s earlier | 1.35x |
| 💀 | Market Crash | Trump events 3x more frequent | 1.2x |
| 💀 | Swarm Tactics | Fast boat swarms +50% size | 1.3x |
| 💀 | Fog of War | Vision reduced by 40% | 1.25x |
| 💀 | Austerity | All unit costs +30% | 1.3x |

- **Score multiplier stacks multiplicatively**: 2 skulls at 1.3x each = 1.69x total
- **Max possible multiplier** (5 skulls): ~3.5-4.0x depending on combination
- **Active skulls shown** on debrief card and leaderboard entry
- **Leaderboard filtering**: view "all", "3+ skulls", "5 skulls" categories
- **Skull selection screen**: shown before game start, after callsign

### Visual Design

- Skull selection screen: dark military briefing room aesthetic
- Each skull displayed as a military hazard warning card
- Active skulls glow red, inactive are dimmed
- Skull count shown in HUD during gameplay (top-right, small skull icons)
- Score multiplier prominently displayed: "SCORE: 2.15x"
- Debrief card shows skull icons beside the score
- Leaderboard entries with 4-5 skulls get a special border glow

### Balance

- Default difficulty (0 skulls) = the current game balance
- 1-2 skulls: noticeable challenge increase, achievable for good players
- 3-4 skulls: very hard, requires optimized strategy
- 5 skulls: extreme challenge, bragging rights
- Score multiplier makes skull runs dominate the leaderboard — incentivizes risk
- Some skull combinations are harder than others (Disarmed + Early Assault = brutal)
- Skull effects modify existing constants, not new systems (low implementation cost)

## Scope

### In Scope
- [ ] Skull unlock tracking (localStorage — requires 1 victory)
- [ ] Skull selection screen (pre-game)
- [ ] 8 skull definitions with effects
- [ ] Apply skull modifiers to game constants at scene creation
- [ ] Multiplicative score multiplier calculation
- [ ] Skull display in HUD, debrief, leaderboard
- [ ] Leaderboard skull filtering

### Out of Scope
- Custom skull creation
- Skulls that add new enemy types (only modify existing parameters)
- Skull-specific achievements (could be added later)
- Skull presets / saved combinations

## Dependencies
- Victory condition must be achievable (0014, shipped)
- Leaderboard integration (0034 for global, 0007 for local)
- Constants system — skulls modify values in constants.js at runtime

## Risks
- **Balance testing**: Each skull combination changes the meta. Focus testing on the most common stacks (2-3 skulls).
- **UI complexity**: Skull selection screen is a new flow before game start. Keep it quick — toggle skulls, see multiplier, start.
- **Score inflation**: High-skull runs dominate leaderboard. This is intentional — skill should be rewarded. Leaderboard filtering helps casual players see relevant competition.

## Alternatives Considered
- **Single difficulty slider (Easy/Medium/Hard)**: Less interesting. Skulls let players customize their challenge and create unique combinations.
- **Difficulty increases automatically based on rank**: Removes player agency. Skulls are opt-in.
- **Skulls as consumables (limited uses)**: Adds unnecessary friction. Always-available is better.
