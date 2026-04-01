# Feature: Multiple Ship Routes

**Status:** `shipped`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

All ships following the same path looks robotic and makes IRGC defense trivial — just place towers along the one route.

## Proposal

Four route variants through the strait. Each ship randomly picks one when deployed, creating organic movement variety and making IRGC defense more challenging.

## Design

### Gameplay Mechanics
- 4 routes: Northern (risky, near Iran), Central (balanced), Southern (safer, near Oman), Zigzag (unpredictable)
- Each ship randomly assigned a route on deployment
- Route is invisible to the player — ships just take different natural paths
- IRGC AI calculates tower proximity against the central route (average)

### Visual Design
- No visible route lines on the map
- Ships naturally spread across the strait during gameplay

### Balance
- Northern route passes closer to IRGC towers = higher risk, slightly shorter
- Southern route is longer but further from towers = lower risk
- Variety forces IRGC to spread defenses rather than stack on one lane

## Scope

### In Scope
- [x] 4 route variants in config
- [x] Random route assignment per ship
- [x] Remove visible route preview

### Out of Scope
- Player-drawn custom routes
- Route selection UI
