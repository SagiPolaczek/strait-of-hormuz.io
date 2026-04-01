# Feature: Tap-to-Collect Oil Rigs

**Status:** `shipped`
**Priority:** `P0`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

Oil rigs passively generating income is boring. The player has no reason to interact with rigs after placing them, and there's no tension between managing economy vs. managing fleet.

## Proposal

Oil rigs accumulate oil internally over time. The player must click/tap on a rig to collect the stored oil. Uncollected oil caps at a maximum per rig. This creates a micro-management tension: collect oil vs. deploy ships vs. watch the strait.

## Design

### Gameplay Mechanics
- Each coalition rig accumulates oil at `OIL_RIG_RATE` (3/sec) into internal storage
- Storage caps at `OIL_RIG_MAX_STORAGE` (60 oil)
- Player clicks on a rig (within 45px radius) to collect all stored oil
- IRGC rigs auto-collect (AI doesn't need to click)
- If a rig is destroyed before collection, stored oil is lost

### Visual Design
- Amber fill bar on the rig shows storage level
- Bar color shifts: amber → gold → orange when full
- "TAP" prompt pulses above rig when storage > 50%
- On collection: golden splash particles, floating "+X 🛢️" text, expanding ring

### Balance
- 60 oil max storage = ~20 seconds of accumulation before cap
- Forces player to check rigs every 15-20 seconds
- Lost oil on rig destruction adds risk/reward to rig placement

## Scope

### In Scope
- [x] Internal oil storage per rig
- [x] Click-to-collect mechanic
- [x] Visual storage indicator
- [x] Collection particle effect
- [x] Pulsing "TAP" prompt

### Out of Scope
- Auto-collect upgrades (future feature)
- Rig upgrade tiers
