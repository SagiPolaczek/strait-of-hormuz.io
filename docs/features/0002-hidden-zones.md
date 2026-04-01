# Feature: Hidden Zones / Misclick Guidance

**Status:** `shipped`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

Colored zone overlays clutter the satellite map and break the clean aesthetic. But without any guidance, players don't know where to place units.

## Proposal

Zones are invisible by default. When a player tries to place a unit in the wrong zone, the correct zone flashes briefly (2-3 seconds) with a text label, then fades away. Players learn through play, not through visual clutter.

## Design

### Gameplay Mechanics
- All zone polygons are computed for hit-testing but not rendered
- On misclick (unit selected, click outside valid zone): correct zone flashes
- Flash shows filled polygon + "PLACE HERE: [ZONE NAME]" label
- Flash fades after ~1.5 seconds

### Visual Design
- Zone flash: semi-transparent fill (15% opacity) with bright border (70% opacity)
- Color matches zone type: blue for coalition, red for IRGC, green for exit
- Text hint floats up slightly and fades

## Scope

### In Scope
- [x] Hidden zone rendering
- [x] Flash-on-misclick for coalition zones
- [x] Zone-specific text hints
- [x] Fade animation

### Out of Scope
- First-time tutorial overlay
- Permanent zone toggle button
