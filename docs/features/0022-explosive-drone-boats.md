# Feature: Explosive Drone Boats (USVs)

**Status:** `draft`
**Priority:** `P1`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #6 of 10 (news-inspired batch)
**Inspired by:** March 1, 2026: First confirmed state-led deployment of explosive unmanned surface vehicle (USV) against commercial shipping — MV MKD VYOM hit in Gulf of Oman. Houthis also used USVs extensively.

## Problem

All current IRGC threats are either static (launchers) or airborne (drones from feature 0015). There's no waterborne stealth threat. Real-world, explosive drone boats are a major new weapon — they sit low in the water, are hard to detect, and detonate on contact.

## Proposal

IRGC deploys **unmanned explosive boats** — small, fast, low-profile watercraft that are nearly invisible until close range. They home in on coalition ships/rigs and detonate on contact.

## Design

### Gameplay Mechanics
- Spawns from IRGC coast, moves along water toward nearest coalition target
- **Semi-stealth**: Not visible until within 150px of a coalition unit (simulating low radar profile)
- Once revealed, targetable by destroyers and laser towers
- Detonates on contact: high damage in a small area (can damage multiple nearby ships)
- Faster than tankers but slower than fast boats
- AI sends 1-3 at a time, increasing over time

### Visual Design
- Hidden state: faint wake trail only (very subtle, attentive players can spot it)
- Revealed state: small dark boat shape with red blinking light
- Detonation: large water explosion, shrapnel, shockwave expanding outward
- Warning: "USV DETECTED" popup when revealed near a ship

### Balance
| Stat | Value |
|------|-------|
| HP | 40 |
| Speed | 120 |
| Damage | 90 (contact detonation) |
| Blast radius | 50px (damages all units nearby) |
| Detection range | 150px |
| Frequency | Every 30-45s after minute 3 |

## Scope

### In Scope
- [ ] USV entity with stealth/reveal mechanic
- [ ] Subtle wake-only visual when hidden
- [ ] Reveal trigger when near coalition units
- [ ] Contact detonation with area damage
- [ ] AI spawning logic

### Out of Scope
- Player-deployed USVs
- Remote-controlled USVs (all autonomous)
- Underwater drones (UUVs — separate feature potential)
