# Feature: Tutorial / Onboarding

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

New players don't know what to do. The hidden zones mechanic helps with placement, but players don't understand the core loop: build rigs → collect oil → deploy ships → get tankers through.

## Proposal

A lightweight, non-intrusive tutorial that guides the first 60 seconds of gameplay through contextual prompts. No modal dialogs, no pausing — just on-screen hints that appear at the right moment.

## Design

### Gameplay Mechanics
- Tutorial triggers on first game session (localStorage flag)
- Contextual prompts appear at key moments:
  1. "BUILD AN OIL RIG → Select 🛢️ and click in the blue zone" (0s)
  2. "TAP YOUR RIG TO COLLECT OIL" (when rig has >30 stored oil)
  3. "DEPLOY A TANKER → Select ⛽ and click in the deploy zone" (when oil > 400)
  4. "GET TANKERS TO THE EXIT ZONE →" with arrow pointing east (when tanker deployed)
  5. "IRGC INCOMING — Deploy destroyers for escort" (when first launcher appears)
- Each prompt shows once, then never again
- "SKIP TUTORIAL" button in corner

### Visual Design
- Military-style briefing text: green monospace on dark panel
- Pulsing arrow pointing to relevant area
- Text fades after action is completed

## Scope

### In Scope
- [ ] 5 contextual prompts
- [ ] localStorage first-run detection
- [ ] Skip button
- [ ] Pulsing arrow indicators

### Out of Scope
- Video tutorial
- Practice mode / sandbox
- Forced tutorial (must be skippable)

## Risks
- Prompts that appear at the wrong time break immersion
- Must carefully time triggers to match natural gameplay flow
