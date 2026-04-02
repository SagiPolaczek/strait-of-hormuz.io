# Feature: Layered Gauntlet Waves

**Status:** `draft`
**Priority:** `P1`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #8 of 10 (news-inspired batch)
**Inspired by:** Iran's documented "magazine-drain" doctrine — layered mines + submarines + coastal missiles + fast boat swarms + drone swarms designed to exhaust defensive ammunition and overwhelm in sequence.

## Problem

Currently, IRGC threats are continuous but unstructured — launchers fire whenever ships are in range. There are no coordinated attack waves. Real IRGC doctrine is about **sequenced, layered attacks** designed to overwhelm. The game needs structured "oh shit" moments.

## Proposal

Replace the current random/continuous threat model with a **wave system** that periodically launches coordinated, multi-layer attacks. Each wave combines different threat types in sequence: first mines slow you, then shore missiles soften you, then fast boats swarm, then drones finish off survivors.

## Design

### Gameplay Mechanics
- Every 90-120 seconds, a **Gauntlet Wave** is announced
- Wave structure (phases execute in sequence over ~30 seconds):
  1. **Mine phase** (0-5s): Minelayer drops mines on active shipping routes
  2. **Barrage phase** (5-15s): All IRGC launchers fire simultaneously (coordinated volley)
  3. **Swarm phase** (10-20s): Fast boat swarm converges from multiple angles
  4. **Air phase** (15-25s): Drone swarm overhead
  5. **Quiet phase** (25-90s): Brief respite to rebuild/reposition
- Wave difficulty scales: early waves use 2-3 phases, late waves use all 5
- Between waves, IRGC activity drops to minimal — the calm before the storm
- Each wave has a name displayed on HUD: "WAVE 3: IRON STORM"

### Visual Design
- Wave announcement: dramatic full-width banner "INCOMING WAVE" with countdown
- Phase transitions: brief flash + phase name ("MINE SCREEN", "BARRAGE", "SWARM", "AIR ASSAULT")
- Between waves: green "ALL CLEAR" indicator, peaceful music shift
- Wave difficulty indicator: 1-5 skull icons showing intensity

### Balance
- Wave 1 (2:00): Mine + Barrage only
- Wave 2 (3:30): Mine + Barrage + Swarm (3 boats)
- Wave 3 (5:00): Barrage + Swarm (6 boats) + Air (3 drones)
- Wave 4 (7:00): Mine + Barrage + Swarm (10 boats) + Air (5 drones)
- Wave 5+ (9:00+): Full gauntlet, increasing numbers each time

## Scope

### In Scope
- [ ] Wave manager system (schedules and orchestrates waves)
- [ ] Phase sequencing within each wave
- [ ] Wave announcement UI (banner, countdown, phase names)
- [ ] Difficulty scaling per wave
- [ ] Quiet periods between waves
- [ ] Wave naming system

### Out of Scope
- Player-triggered waves (always automatic)
- Boss waves (could be a separate feature)
- Wave skipping / fast-forward

## Dependencies
- Requires naval mines (0017), fast boats (0018), and drones (0015) to be implemented for full wave variety
- Can ship with partial wave types if those features aren't ready
