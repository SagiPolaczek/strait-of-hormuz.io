# Feature: Convoy Escort Mode

**Status:** `draft`
**Priority:** `P3`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

Current gameplay is pure survival with no narrative arc. A structured mode with missions/objectives would add variety and a sense of progression.

## Proposal

A separate game mode: escort a specific convoy of high-value ships through the strait. Pre-set IRGC defense layout, limited budget, specific objectives. Think "puzzle" mode vs. the current "endless" mode.

## Design

### Gameplay Mechanics
- 10-15 hand-crafted levels with increasing difficulty
- Each level: fixed IRGC defense layout, fixed budget, specific convoy to escort
- Objectives: "Get 3/5 tankers through", "Survive 2 minutes", "Destroy all launchers"
- Star rating: 1-3 stars based on performance
- Unlocks in order

### Visual Design
- Level select screen: map of the strait with numbered mission markers
- Mission briefing: "OPERATION DESERT PASSAGE — Escort 5 tankers through hostile waters"
- Per-level debrief with star rating

### Balance
- Early levels: 1-2 launchers, generous budget, teach mechanics
- Mid levels: multiple launcher types, mines, limited budget
- Late levels: full IRGC arsenal, tight budget, requires optimal play

## Dependencies
- Core gameplay loop must be stable
- Additional IRGC unit types (mines, speedboats, drones) for variety

## Risks
- Significant content creation effort (15 levels)
- Balancing each level is time-consuming
- May split player attention from the viral endless mode

## Alternatives Considered
- **Daily challenge:** One procedurally generated level per day — less effort, more replayable
- **Community levels:** Let players create and share defense layouts — most scalable but needs a backend
