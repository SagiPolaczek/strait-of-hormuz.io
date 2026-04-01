# Feature: Minesweeper Unit

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

IRGC mine layers (from the design spec) have no counter. Players need a way to clear mines from shipping lanes, adding a rock-paper-scissors dynamic to unit composition.

## Proposal

A slow, specialized ship that detects and clears naval mines in a radius ahead of it. Sending one ahead of a tanker convoy is the smart play.

## Design

### Gameplay Mechanics
- Deploys from COALITION_DEPLOY zone, follows ship routes
- Scans a cone-shaped area ahead (120° arc, 150px range)
- Automatically detonates mines within scan range (takes 1.5s per mine)
- Low HP — vulnerable to missiles, needs destroyer escort
- Cannot attack towers or speedboats

### Visual Design
- Wider hull with sonar dome at bow (pulsing circle)
- Scan cone rendered as faint green arc ahead of ship
- Mine detection: mine blinks red before detonation
- Mine cleared: small water splash + "MINE CLEARED" text

### Balance
- Cost: 250 oil
- HP: 80 (fragile)
- Speed: 50 px/s (slow)
- Scan range: 150px
- Clear time: 1.5s per mine

## Dependencies
- Requires IRGC Mine Layer building (0010 or separate feature)
- Requires Mine entity

## Risks
- Mines as invisible obstacles need careful visual feedback
- Too cheap = mines become irrelevant; too expensive = nobody uses minesweeper
