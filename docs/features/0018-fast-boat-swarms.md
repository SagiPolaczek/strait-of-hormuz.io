# Feature: IRGC Fast Boat Swarms

**Status:** `draft`
**Priority:** `P0`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #2 of 10 (news-inspired batch)
**Inspired by:** IRGC uses 10-20 fast attack boats swarming a single ship from 360° at 50-70 knots. This is their signature tactic, documented extensively in the 2026 crisis.

## Problem

Currently IRGC only has static missile launchers. The enemy has no mobile units. Real IRGC doctrine is built around fast boat swarms — cheap, fast, expendable boats that overwhelm defenses with numbers. The game needs mobile enemies.

## Proposal

Periodically, the IRGC launches a **swarm of fast attack boats** (5-15 boats) that converge on coalition ships from multiple directions. Each boat is cheap and fragile but fast. Some are armed with guns, some are explosive suicide boats. The player must prioritize targets or get overwhelmed.

## Design

### Gameplay Mechanics
- Swarm wave spawns from multiple points along the Iranian coast simultaneously
- Each boat picks the nearest coalition ship/rig and charges toward it
- **Gun boats**: Low damage, rapid fire, circle the target harassing it
- **Suicide boats**: No guns, but explode on contact for massive damage (like a self-propelled mine)
- Swarm composition scales with escalation: early = 5 boats (2 suicide), late = 15 boats (6 suicide)
- Boats are fast (speed: 150-200) but fragile (HP: 30-50)
- Destroyers auto-target them, but a single destroyer can't kill a full swarm fast enough

### Visual Design
- Tiny boat silhouettes, white wake trails, moving fast
- Suicide boats: glowing red hull, sparking
- Swarm arrives with a "SWARM INCOMING" HUD warning
- When a suicide boat detonates: water explosion, shockwave, debris
- Gun boats: small muzzle flashes while circling

### Balance
| Type | HP | Speed | Damage | Behavior |
|------|-----|-------|--------|----------|
| Gun boat | 50 | 150 | 8/shot (rapid) | Circles target at ~60px, fires continuously |
| Suicide boat | 30 | 200 | 100 on contact | Charges straight at target, detonates |

- Swarm frequency: Every 45-60 seconds after minute 2
- Swarm size scales: 5 → 8 → 12 → 15 boats over time
- A single destroyer can handle ~4 boats per swarm — player needs multiple defenders or other defenses

## Scope

### In Scope
- [ ] FastBoat entity (two variants: gun boat, suicide boat)
- [ ] Swarm spawner system (multiple spawn points, converging behavior)
- [ ] HUD warning for incoming swarm
- [ ] Swarm scaling with escalation
- [ ] Gun boat circling/strafing AI
- [ ] Suicide boat charge + detonation

### Out of Scope
- Player-controlled fast boats
- IRGC fast boats capturing ships (see feature 0021 for boarding)
- Fast boats laying mines (keep mine-laying to dedicated minelayers)
