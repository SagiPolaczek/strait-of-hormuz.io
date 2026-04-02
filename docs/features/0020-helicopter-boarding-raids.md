# Feature: IRGC Helicopter Boarding Raids

**Status:** `draft`
**Priority:** `P1`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #4 of 10 (news-inspired batch)
**Inspired by:** Nov-Dec 2025: IRGC commandos rappelled from helicopters onto tankers near Qeshm Island. Multiple tankers seized and towed to Iranian waters. Captured on video.

## Problem

Currently when ships are attacked, they just take HP damage. There's no "capture" mechanic. Real-world, Iran's scariest move isn't sinking tankers — it's *seizing* them. This creates a uniquely stressful threat: your tanker isn't destroyed, it's being stolen. You can still save it.

## Proposal

IRGC launches **helicopter raids** that attempt to **board and capture** coalition tankers. A helicopter flies to a tanker, hovers above it, and begins a boarding timer. If the timer completes, the tanker is seized and starts moving toward Iran. Player can intercept by destroying the helicopter or having a destroyer escort nearby to fend off the boarding.

## Design

### Gameplay Mechanics
- IRGC helicopter spawns from Iranian coast, flies toward a tanker (bypasses ground defenses — it's airborne)
- Hovers above the tanker and begins a **10-second boarding timer** (visible progress bar)
- During boarding: tanker is slowed to 50% speed
- If boarding completes: tanker is "captured" — changes color to red, reverses course toward Iran. Score is LOST if it reaches Iranian waters.
- **Counter-play**:
  - Destroy the helicopter before boarding completes (HP: 120, targetable by destroyers and air defense)
  - Destroyer escort within 100px automatically "repels" the boarding (fires at helicopter)
  - Air defense systems (feature 0015) can target helicopters
- If helicopter is destroyed mid-boarding: tanker resumes normal course
- Captured tankers can still be "rescued" — destroy the helicopter escort before the tanker reaches Iran

### Visual Design
- Helicopter: small rotor silhouette with spinning blades, fast movement
- Boarding: rope lines dropping from helicopter to tanker, flashing warning on tanker
- Boarding timer: red circular progress bar above the tanker
- Captured tanker: hull tints red, "SEIZED" label, sad reversal animation
- Rescue: tanker flashes back to blue, "RESCUED" celebration text

### Balance
| Stat | Value |
|------|-------|
| Helicopter HP | 120 |
| Helicopter speed | 180 |
| Boarding time | 10 seconds |
| Frequency | Every 60-90s after minute 4 |
| Tanker slow during boarding | 50% speed |

## Scope

### In Scope
- [ ] Helicopter entity (IRGC, air unit, flies to tanker)
- [ ] Boarding mechanic (timer, slowdown, capture)
- [ ] Captured tanker behavior (reverses course, moves toward Iran)
- [ ] Rescue mechanic (destroy helicopter to free tanker)
- [ ] HUD warning: "BOARDING RAID INCOMING"
- [ ] Visual: ropes, timer bar, color change on capture

### Out of Scope
- Player-controlled helicopters
- Helicopter transporting ground troops
- Multiple helicopters per raid (one at a time for now)
