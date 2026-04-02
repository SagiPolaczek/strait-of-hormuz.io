# Feature: IRGC Mini-Submarines

**Status:** `draft`
**Priority:** `P2`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #7 of 10 (news-inspired batch)
**Inspired by:** Iran expanded its Ghadir-class mini-submarine fleet in 2025. These operate in shallow Gulf waters, can fire torpedoes and lay mines. US destroyed one submarine during Operation Epic Fury.

## Problem

All enemy units operate on the surface or in the air. There's no underwater threat dimension. Mini-submarines add a "hidden predator" enemy type that requires specific counter-play (sonar detection, ASW).

## Proposal

IRGC deploys **mini-submarines** that travel submerged and invisible. They surface briefly to fire a torpedo at a coalition ship, then submerge again. They can also lay mines. The player needs sonar-equipped destroyers or a dedicated ASW (anti-submarine warfare) upgrade to detect and engage them.

## Design

### Gameplay Mechanics
- Submarine travels submerged — completely invisible to all units
- Surfaces for 4 seconds to fire a torpedo, then dives again
- Torpedo: fast, high damage, homing on target
- Can also drop a mine before submerging (ties into feature 0017)
- **Detection**: Only visible when surfaced, OR when within range of a sonar-equipped unit
- **Sonar**: Destroyer upgrade (feature 0013) or dedicated sonar buoy item reveals subs within 200px
- When detected and surfaced: fragile (low HP)

### Visual Design
- Submerged: completely invisible (maybe faint periscope wake if player looks carefully)
- Surfacing: submarine silhouette rises, water splash, brief conning tower visible
- Torpedo launch: flash, fast-moving projectile with bubble trail
- Torpedo impact: underwater explosion, water column
- Detected by sonar: pulsing sonar ring reveals red submarine outline

### Balance
| Stat | Value |
|------|-------|
| HP | 80 (when surfaced) |
| Speed | 70 (submerged), 40 (surfaced) |
| Torpedo damage | 100 |
| Surface time | 4 seconds |
| Dive cooldown | 12 seconds |
| Frequency | Every 60-90s after minute 5 |

## Scope

### In Scope
- [ ] MiniSubmarine entity with submerge/surface states
- [ ] Torpedo projectile type
- [ ] Sonar detection mechanic
- [ ] Surface/dive animation
- [ ] AI patrol and attack behavior

### Out of Scope
- Player submarines
- Deep water / depth layers
- Submarine-laid minefields (keep mine-laying to dedicated minelayers)
- Anti-submarine helicopters
