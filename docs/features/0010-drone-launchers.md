# Feature: IRGC Drone Launchers

**Status:** `draft`
**Priority:** `P2`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

IRGC needs more unit variety for late-game escalation. Currently only missile launchers — gameplay becomes repetitive after 5+ minutes.

## Proposal

Drone Launcher: a new IRGC building that sends suicide drones. Cheap, slow, hard to intercept individually, but low damage per hit. Creates a "death by a thousand cuts" pressure in late game.

## Design

### Gameplay Mechanics
- IRGC building placed on coast/islands (same zones as missile launcher)
- Launches one drone every 4 seconds
- Drones: slow (80 px/s), very low HP (10), low damage (12)
- Drones home in on nearest ship, explode on contact
- Destroyers can shoot them down but they're small targets
- AI starts building these at 5-minute escalation threshold

### Visual Design
- Launcher: flat pad with small drone silhouette
- Drone: tiny X-shaped silhouette with buzzing trail
- On impact: small pop + sparks (less dramatic than missiles)

### Balance
- Launcher cost: 200 oil (cheap for AI)
- Launcher HP: 80 (fragile)
- Drone speed: 80 px/s
- Drone HP: 10
- Drone damage: 12
- Launch rate: 1 every 4 seconds

## Dependencies
- None — new entity types

## Risks
- Too many drones = visual clutter + performance
- Cap at 15-20 active drones
