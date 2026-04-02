# Feature: Advanced Weapons Unlock (Missiles, UAVs, Air Defense)

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

Combat is currently one-dimensional — IRGC has missile launchers, coalition has destroyers. After a few minutes the gameplay loop feels repetitive. The game needs an escalation moment that changes the battlefield and introduces new threats and counterplay.

## Proposal

At the **3-minute mark**, both sides unlock advanced weapons:

- **IRGC** gets: cruise missiles (long-range, high damage, slow) and exploding UAV drones (fast, low HP, suicide attack)
- **Coalition** gets: an air defense system (intercepts incoming missiles and UAVs before they hit)

This creates a mid-game phase shift — the IRGC threat level jumps, but the player gets the tools to counter it.

## Design

### IRGC — Cruise Missiles

- AI-controlled, auto-launched from off-screen (Iranian mainland) on a cooldown
- Slow-moving, visible on the map with a warning indicator and trail
- High damage — can one-shot a tanker or heavily damage a destroyer
- Targetable by coalition air defense
- Visual: large missile with thick smoke trail, warning siren icon appears before launch

### IRGC — Exploding UAVs (Shahed-style)

- AI-controlled, spawned from IRGC_BUILD zone
- Fast, low HP — easy to shoot down but dangerous if they reach a target
- Suicide attack: flies into a ship/rig and detonates
- Comes in swarms of 2-3 at a time
- Visual: small delta-wing shape, buzzing trail, explosion on impact

### Coalition — Air Defense System (Iron Dome style)

- Player-purchased unit, placed in COALITION_DEPLOY zone
- Automatically targets and intercepts incoming missiles and UAVs within range
- Does NOT target ground units (launchers, ships) — purely anti-air
- Limited intercept rate (cooldown between shots) so swarms can overwhelm it
- Visual: radar dish on a platform, interceptor trails shooting upward, explosion when target is neutralized

### Unlock Mechanic

- At 3:00, a dramatic HUD notification: "ADVANCED WEAPONS UNLOCKED" with flash effect
- IRGC starts using missiles/UAVs via AI controller
- Air Defense System appears in the deployment bar as a new purchasable unit (grayed out / locked icon before 3:00)
- Could tie into the threat level HUD — threat jumps to MEDIUM/HIGH at this point

### Balance

| Unit | Side | Cost | HP | Damage | Speed | Range | Cooldown |
|------|------|------|----|--------|-------|-------|----------|
| Cruise Missile | IRGC (auto) | — | 60 | 120 | 100 | map-wide | 20s |
| Exploding UAV | IRGC (auto) | — | 30 | 70 | 180 | map-wide | 12s (swarm of 2-3) |
| Air Defense | Coalition | 600 | 250 | 80 (vs air) | 0 (static) | 400 | 3s |

- Cruise missiles are slow enough to intercept if the player has air defense coverage
- UAV swarms can overwhelm a single air defense — player needs multiple or good destroyer coverage
- Air defense is expensive (600 oil) — a real investment that trades offensive capability for protection
- IRGC launch rates scale with escalation multiplier

## Scope

### In Scope
- [ ] Unlock timer system (3-minute gate)
- [ ] HUD notification for unlock event
- [ ] Cruise Missile entity (IRGC, AI-launched, targetable)
- [ ] Exploding UAV entity (IRGC, AI-spawned from build zone, swarm behavior)
- [ ] Air Defense System entity (coalition, player-placed, auto-intercepts air targets)
- [ ] Air Defense added to deployment bar (locked before 3:00, unlocked after)
- [ ] AI controller updates to spawn missiles and UAVs after unlock
- [ ] Visual/audio cues: warning indicators, intercept trails, explosions
- [ ] New projectile type for interceptor missiles

### Out of Scope
- Player-aimed missiles (everything is auto-target for now)
- UAV drones for coalition side
- Multiple tiers of air defense
- Pre-3-minute unlock via spending

## Dependencies
- AI Controller needs new spawn logic for missiles and UAVs
- Deployment bar needs support for locked/unlockable units
- New entity classes: CruiseMissile, ExplodingUAV, AirDefense
- Projectile system needs "interceptor" type that targets other projectiles/entities in the air

## Risks
- **Complexity spike**: Three new entity types at once is a big scope. Could phase it (missiles first, then UAVs, then air defense).
- **Balance**: If air defense is too effective, the unlock feels like nothing changed. If too weak, the player feels helpless. Needs playtesting.
- **Visual clutter**: Missiles, UAVs, interceptors, explosions all at once could overwhelm the screen. Keep effects clean and distinct.
- **AI tuning**: IRGC needs to use these smartly — not waste missiles on destroyers when tankers are the real target.

## Alternatives Considered
- **Unlock via spending instead of time**: Considered letting the player "research" these. Rejected — time-gate is simpler and guarantees the phase shift happens, creating a shared dramatic moment.
- **Only add air defense, no new IRGC units**: Boring — defense without a new threat to defend against isn't compelling.
- **Unlock at 5 minutes**: Too late — most games might not last that long. 3 minutes hits the sweet spot where the player has established their economy.
