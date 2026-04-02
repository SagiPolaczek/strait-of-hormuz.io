# Feature: HELIOS Laser Defense Tower

**Status:** `draft`
**Priority:** `P1`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #3 of 10 (news-inspired batch)
**Inspired by:** USS Preble successfully destroyed 4 drones with HELIOS laser (60-120kW) in 2025 tests. In March 2026, Navy destroyer "vaporized a drone swarm" with laser. Cost per shot = electricity only vs million-dollar interceptors.

## Problem

The cost asymmetry is broken: Iran launches $20,000 drones that force the expenditure of multi-million dollar interceptors. The game's air defense (feature 0015) uses conventional interceptors with cooldowns. A laser tower solves the ammo/cost problem but with its own tradeoffs.

## Proposal

A **HELIOS laser tower** — continuous beam weapon that's devastating against drones and fast boats (light targets) but weak against armored targets. Unlimited ammo as long as it has power. Overheats if fired too long. The anti-swarm answer.

## Design

### Gameplay Mechanics
- Placed in COALITION_DEPLOY zone
- Fires a continuous beam at the nearest air/light target (drones, UAVs, fast boats)
- Damage is continuous (DPS) not per-shot — melts targets over 1-2 seconds
- **Heat mechanic**: Beam builds heat. After ~5 seconds of continuous fire, overheats and needs 3-4 second cooldown. Forces player to think about placement (covering multiple approach vectors = more heat management)
- Very effective vs: drones, UAVs, fast boats, projectiles
- Weak vs: heavily armored targets (missiles, ships) — beam takes too long to burn through
- Can "dazzle" mode: low power mode that confuses incoming missile guidance (small accuracy debuff in an area)

### Visual Design
- Base: angular military platform with radar dome
- Beam: bright blue-white laser line from turret to target, with bloom/glow effect
- Target effect: target glows bright, sparks, then burns up
- Overheat: turret glows orange/red, steam vents, "COOLING" indicator
- Idle: slow radar rotation, faint blue glow on turret
- Range circle: bright blue dashed circle

### Balance
| Stat | Value |
|------|-------|
| Cost | 500 oil |
| HP | 200 |
| DPS | 40 (vs light), 15 (vs heavy) |
| Range | 300 |
| Overheat time | 5s continuous fire |
| Cooldown | 3.5s |

## Scope

### In Scope
- [ ] HELIOS entity (coalition, player-placed)
- [ ] Continuous beam rendering (laser line with glow)
- [ ] Heat/overheat mechanic with visual indicator
- [ ] Target priority: drones > fast boats > missiles > other
- [ ] Added to deployment bar

### Out of Scope
- Power grid / generator mechanic
- Multiple beam modes (just one mode for now)
- Upgradeable power levels (handled by feature 0013 if desired)
