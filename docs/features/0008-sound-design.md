# Feature: Sound Design

**Status:** `draft`
**Priority:** `P2`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

The game is completely silent. Sound is a massive factor in game feel — explosions, missile launches, oil collection, and ambient ocean sounds would dramatically improve immersion.

## Proposal

Add a layered sound system: ambient background, UI feedback sounds, combat sounds, and a satirical "news report" style announcer for key events.

## Design

### Sound Categories
- **Ambient:** Low ocean waves + distant radio chatter loop
- **UI:** Click/select (military beep), deploy confirmation, oil collection (cash register ding), error (buzzer)
- **Combat:** Missile launch (whoosh), explosion (boom), ship destruction (large explosion + debris), speedboat swarm (engine buzz)
- **Music:** Tense military synth track, escalates with threat level
- **Announcer (satirical):** Brief voice lines on events: "Tanker through!", "Oil rig under attack!", "IRGC escalating!", game over quip

### Technical Approach
- Use Phaser's built-in audio system
- Web Audio API for spatial sound (missiles sound louder near camera center)
- Sound sprites for efficiency (one file, multiple clips)
- Volume controls in a settings menu

## Scope

### In Scope
- [ ] 5-6 core sound effects (click, explode, missile, oil collect, deploy, game over)
- [ ] Ambient ocean loop
- [ ] Volume toggle (mute button)

### Out of Scope (Phase 1)
- Announcer voice lines
- Spatial audio
- Dynamic music

## Risks
- Audio autoplay blocked by browsers — need user interaction first (already solved by boot screen click)
- File size — keep total audio under 2MB for fast load
