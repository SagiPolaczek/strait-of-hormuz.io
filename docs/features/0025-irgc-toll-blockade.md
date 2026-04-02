# Feature: IRGC Toll Blockade / Checkpoint

**Status:** `draft`
**Priority:** `P2`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #9 of 10 (news-inspired batch)
**Inspired by:** March 27, 2026: IRGC literally created a tollbooth in the Strait of Hormuz, charging merchant ships for "safe passage." This is unprecedented in modern naval warfare.

## Problem

IRGC opposition is purely military — shoot and destroy. Real-world, Iran uses economic warfare too. The tollbooth is a uniquely absurd and threatening mechanic that creates an interesting strategic dilemma: pay, fight, or sneak past?

## Proposal

After a certain time, IRGC establishes a **checkpoint/blockade** across the shipping lane. Ships that enter the checkpoint zone are **stopped and held**. The player has three options: **pay a toll** (spend oil to let the ship through), **fight** (destroy the checkpoint to clear the route), or **run the blockade** (send the ship through at risk of heavy damage).

## Design

### Gameplay Mechanics
- At minute 6, IRGC places a blockade across the narrowest part of the strait
- Blockade is a fortified position: patrol boats + a barrier
- Ships entering the blockade zone (200px wide strip) are **stopped**
- Player chooses per ship:
  - **Pay toll**: Costs 200 oil. Ship is released and continues safely.
  - **Run it**: Ship forces through at 50% speed, takes continuous damage from blockade guns.
  - **Destroy blockade**: Attack the checkpoint (HP: 500). Once destroyed, route is clear for 2 minutes before IRGC rebuilds.
- Destroyers can attack the blockade while escorting
- F-22s (feature 0016) can bomb the blockade

### Visual Design
- Blockade: line of patrol boats with a barrier chain/boom across the lane
- Red zone overlay on the blocked area
- Stopped ship: flashing amber "HELD" indicator, popup showing toll/run/fight options
- Paying toll: coins flying from ship to blockade, ship released
- Running blockade: ship shakes, sparks, damage numbers, tense
- Destroyed blockade: massive explosion, debris, "BLOCKADE CLEARED" banner

### Balance
| Stat | Value |
|------|-------|
| Blockade HP | 500 |
| Toll cost | 200 oil per ship |
| Run damage | 15/second while in zone (~3 seconds = 45 damage) |
| Rebuild time | 120 seconds after destruction |
| Unlock time | Minute 6 |

## Scope

### In Scope
- [ ] Blockade entity (fortified checkpoint across shipping lane)
- [ ] Ship stop/hold mechanic in blockade zone
- [ ] Player choice UI (pay / run / fight)
- [ ] Blockade destruction and rebuild cycle
- [ ] Toll payment effect

### Out of Scope
- Multiple blockade locations
- Negotiation / diplomacy mechanic
- Blockade affecting IRGC ships
