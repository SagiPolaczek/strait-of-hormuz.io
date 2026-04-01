# Feature: Mobile Touch Controls

**Status:** `draft`
**Priority:** `P2`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

The game targets viral sharing — most viral content is consumed on mobile. Current UI is designed for desktop mouse interaction and doesn't work well on small screens.

## Proposal

Responsive touch controls: larger tap targets, pinch-to-zoom on the map, redesigned deployment bar for thumb reach, and haptic feedback on actions.

## Design

### Gameplay Mechanics
- Same core gameplay, adapted for touch
- Pinch-to-zoom: zoom into specific areas of the map
- Tap to select unit, tap to place (same as mouse)
- Long-press on rig to collect oil (alternative to precise tap)

### Visual Design
- Deployment bar: bottom-sheet style, larger icons (48px+)
- HUD: simplified, fewer stats visible (expand on tap)
- Tap ripple effect on touch
- Larger hit areas for oil rig collection

### Technical
- Detect mobile via `navigator.userAgent` or screen width
- Scale UI elements based on viewport
- Use Phaser's built-in touch input (already supported)

## Scope

### In Scope
- [ ] Detect mobile and adjust UI scale
- [ ] Larger touch targets for deployment bar
- [ ] Pinch-to-zoom camera
- [ ] Long-press oil collection

### Out of Scope
- Native app wrapper
- Landscape lock
- Offline support

## Risks
- Performance on low-end mobile devices (particle effects)
- Small screen makes the strait very cramped
- May need to reduce visual effects on mobile
