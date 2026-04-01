# Feature: IRGC Speedboat Swarms

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

IRGC only has static missile launchers. Real IRGC doctrine relies heavily on fast attack boat swarms — 10-20 speedboats rushing from multiple angles. This is the signature tactic that should be in the game.

## Proposal

IRGC builds Speedboat Docks that periodically spawn swarms of small, fast boats. Boats rush toward the nearest coalition ship and ram it (suicide attack) or strafe with machine guns.

## Design

### Gameplay Mechanics
- Speedboat Dock: IRGC building placed on coast, spawns 3-5 boats every 15 seconds
- Each speedboat: very fast (200 px/s), very low HP (20), low damage (15 per hit)
- Boats beeline toward nearest coalition ship
- On contact: small explosion, boat destroyed, target takes damage
- Destroyers can shoot them down (primary counter)

### Visual Design
- Dock: small pier structure with boats moored alongside
- Speedboats: tiny, fast-moving shapes with white wake spray
- Swarm behavior: boats fan out slightly, creating a V-formation
- On impact: small splash + fire

### Balance
- Dock cost: 250 oil (for AI)
- Dock HP: 100
- Spawns 3-5 boats every 15s
- Boat speed: 200 px/s
- Boat HP: 20
- Boat damage: 15
- AI starts building docks at 2-minute escalation threshold

## Dependencies
- None — new entity types (SpeedboatDock, Speedboat)

## Risks
- Too many speedboats = performance issues (particle emitters per boat)
- Need to cap active speedboats at ~20-30 simultaneously
