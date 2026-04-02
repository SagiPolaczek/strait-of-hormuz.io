# Feature: Naval Mines & Minefields

**Status:** `draft`
**Priority:** `P0`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #1 of 10 (news-inspired batch)
**Inspired by:** Iran began planting naval mines in the Strait of Hormuz on March 11, 2026. US sank 16 Iranian minelayers. Iran has 2,000-3,000 mines in inventory.

## Problem

The current game has no hidden/environmental hazards. All threats are visible missile launchers. Real-world, mines are Iran's #1 area-denial weapon — cheap, invisible, and terrifying. The game is missing this entire threat dimension.

## Proposal

IRGC deploys **naval mines** on shipping routes. Mines are **invisible** until a ship gets close (or a minesweeper reveals them). Hitting a mine deals massive damage. This forces the player to either scout ahead, deploy minesweepers, or accept losses.

## Design

### Gameplay Mechanics
- AI plants mines on or near shipping lanes, increasing density over time
- Mines are invisible by default — shown as a subtle "?" blip when a ship is within ~80px
- Contact = instant 80-100 damage (one-shots a tanker, near-kills a destroyer)
- Mines persist until triggered or swept
- Minesweeper unit (see feature 0004) or destroyer upgrade can reveal/destroy mines in a radius
- AI deploys mines from small minelayer boats that travel from IRGC coast — player can intercept the minelayer before it drops its payload

### Visual Design
- Hidden mines: invisible, no visual
- Detected mines: pulsing red circle with "MINE" warning, hazard pattern
- Mine detonation: massive underwater explosion, huge water column, shockwave ring
- Minelayer boats: small, fast IRGC boats that drop mines and retreat

### Balance
- Mine damage: 90 (kills tankers at 100 HP, heavily damages destroyers at 180 HP)
- Mine detection radius: 80px (by ship proximity), 200px (by minesweeper)
- AI places 1-2 mines per minute early game, scaling to 4-5 per minute late game
- Minelayer boat HP: 60 (fragile, can be intercepted)

## Scope

### In Scope
- [ ] Mine entity (hidden, contact-triggered)
- [ ] Mine detection/reveal mechanic
- [ ] Mine detonation effects
- [ ] IRGC minelayer boat AI (spawns, drops mines, retreats)
- [ ] Mine density scaling over time

### Out of Scope
- Different mine types (moored, influence, smart mines)
- Player-placed mines
- Underwater visuals/layer
