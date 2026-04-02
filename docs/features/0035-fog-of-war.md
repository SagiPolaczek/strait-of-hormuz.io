# Feature: Fog of War / Intelligence Radius

**Status:** `draft`
**Priority:** `P2`
**Author:** Sagi
**Date:** 2026-04-02

## Problem

The entire map is visible at all times. IRGC launcher placements, mine locations, and incoming threats are immediately apparent. This removes the element of surprise and reduces the value of scouting. The strait should feel dangerous and uncertain — you're pushing ships into contested waters where you don't know what's waiting.

## Proposal

A fog of war system where unexplored areas are shrouded in darkness. Coalition units reveal terrain around them within a vision radius. IRGC buildings and units are only visible within revealed areas. Creates discovery tension and increases the value of scouting with destroyers/submarines.

## Design

### Gameplay Mechanics

- **Fog states**: 
  1. **Unexplored** (black overlay, ~85% opacity) — never seen
  2. **Previously seen** (dark overlay, ~45% opacity) — was revealed but no allied unit nearby now. Terrain visible, units hidden.
  3. **Visible** (no overlay) — within vision radius of a coalition unit
- **Vision radii**:
  | Unit | Vision Radius |
  |------|--------------|
  | Oil Rig | 200px |
  | Tanker | 180px |
  | Destroyer | 280px |
  | Air Defense | 350px |
  | Airfield | 300px |
  | Coalition Sub | 250px (+ sonar range reveals subs) |
  | F-22 (in flight) | 400px |
- **Fog affects**:
  - IRGC buildings: invisible in fog, visible once revealed
  - IRGC boats/air: only visible within coalition vision
  - Mines: detection radius still applies, but mine warning only shows in visible area
  - Projectiles: always visible (you see the missile coming even if you can't see the launcher)
- **Map starts** with coalition zones revealed + a small radius around starting position
- **Fog does NOT affect IRGC AI** — the AI always knows where your units are (keeps difficulty fair)

### Visual Design

- Fog rendered as a full-map overlay using a Phaser RenderTexture
- Vision areas are "punched out" as soft-edged circles (Gaussian falloff)
- Fog color: deep navy (#0a0e14) with slight noise texture for visual interest
- Previously-seen areas show the satellite map at reduced brightness
- Fog edge has a subtle animated shimmer (like heat distortion)
- When a new area is revealed for the first time: brief "scan line" sweep effect
- Minimap overlay (if added later) respects fog state

### Balance

- Coalition oil zones start fully revealed (player can always place rigs)
- Coalition deploy zone revealed (player can always deploy ships)
- IRGC coast is dark at start — player discovers launchers as ships approach
- Islands (Qeshm, Hormuz) are dark — exploring them reveals IRGC fortifications
- Destroyers have the best surface vision (incentivizes sending escorts ahead)
- F-22 has the best vision (airborne reconnaissance bonus)
- Persistent unlock "Recon Satellite" (0032) can partially reveal the map at start

### Performance

- Fog rendered to an offscreen canvas, updated only when unit positions change significantly (>20px movement threshold)
- Circle punch-outs use pre-computed radial gradient sprites (not per-pixel calculation)
- Update fog texture at 10fps max (not every frame)
- Only the visible portion needs to be composited — use camera culling

## Scope

### In Scope
- [ ] Fog overlay system (RenderTexture or Graphics-based)
- [ ] Vision radius per unit type
- [ ] Three fog states (unexplored, previously seen, visible)
- [ ] Fog updates as units move
- [ ] IRGC entities hidden in fog
- [ ] Performance-optimized rendering (throttled updates)
- [ ] Starting revealed areas (coalition zones)

### Out of Scope
- Minimap with fog
- IRGC units having their own fog (AI is omniscient)
- Fog affecting projectile targeting (too frustrating)
- Upgradeable vision radius per unit

## Dependencies
- Entity visibility system — entities need a `visible` state driven by fog
- Zone system — needs to mark coalition zones as pre-revealed

## Risks
- **Performance**: Fog rendering on a 1920x1539 canvas is expensive. Throttled updates + pre-computed gradients mitigate this. Test on low-end devices.
- **Frustration**: Players may feel blind. Starting with coalition zones revealed and generous vision radii helps. Previously-seen state means you keep map knowledge.
- **Difficulty spike**: Players can't see incoming threats early. Projectiles being always-visible prevents invisible missile deaths. Audio warnings ("missile detected") help too.
- **Complexity**: Fog interacting with mines, submarines, and sonar adds edge cases. Test thoroughly.

## Alternatives Considered
- **Radar ping system instead of continuous fog**: Less immersive, more arcade-y. Continuous fog feels more military/realistic.
- **Fog only on first playthrough**: Doesn't add replayability. Persistent fog means every run has discovery.
- **Line-of-sight (not radius)**: Too expensive to compute per-frame for multiple units. Radius-based is simpler and sufficient.
