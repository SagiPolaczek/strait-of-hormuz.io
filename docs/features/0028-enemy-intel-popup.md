# Feature: Enemy Intel Popup

**Status:** `shipped`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

Players have no way to understand what IRGC units do. When facing a new threat (missile launcher, mine, drone, cruise missile), they don't know its damage, range, or behavior. This makes the game feel opaque and frustrating, especially for new players.

## Proposal

Click any IRGC unit on the map to see an **intel card** in the left panel showing: unit name, type, current HP, stats (damage, range, speed), and a brief tactical description of what it does and how to counter it.

## Design

- Clicking an enemy unit shows intel in the left upgrade panel (reused space)
- Header: "ENEMY INTEL" in red
- Shows: name, type classification, HP bar, key stats, tactical description
- Includes counter-play hints ("Use Air Defense to intercept")
- Clicking elsewhere or clicking a coalition unit switches back to upgrade view
