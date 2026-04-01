# Feature: Fighter Jet Air Strike

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

Players have no way to destroy IRGC towers directly. As towers accumulate, the strait becomes impassable. Players need an offensive option to thin out defenses.

## Proposal

A one-shot air strike unit. Select target tower, fighter jet flies in from off-screen, drops ordnance, flies away. Expensive but powerful. Forces the IRGC to build AA guns (future counter-unit).

## Design

### Gameplay Mechanics
- Select Fighter Jet from deployment bar → click an IRGC tower to target
- Jet spawns from bottom-right (off-screen), flies a straight path to target
- Drops bomb at target location → explosion deals heavy damage
- Jet continues flying and exits off-screen (not persistent)
- One-use: each deployment = one strike

### Visual Design
- Sleek jet silhouette flying fast across the map
- Contrail/vapor trail behind it
- Dramatic bomb-drop animation (dark circle falling)
- Large explosion at impact: fire, smoke, debris, screen shake
- Jet shadow on the water below

### Balance
- Cost: 600 oil (expensive)
- Damage: 120 (enough to destroy a launcher in one hit at full HP)
- Flight speed: 400 px/s (fast, hard to intercept)
- Cooldown: None (limited by cost)

## Dependencies
- None — can target existing MissileLauncher entities

## Risks
- If too cheap, players just air-strike everything and ignore ships
- Needs future counter: IRGC AA gun (shoots down jets mid-flight)

## Alternatives Considered
- **Persistent patrol aircraft:** Too complex for the payoff, clutters the map
- **Targeted missile from off-screen:** Less visually exciting than a jet flyover
