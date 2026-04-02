# Feature: IRGC Tunnel / Cave Spawners

**Status:** `draft`
**Priority:** `P2`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #10 of 10 (news-inspired batch)
**Inspired by:** Iran's IRGCN conceals mines, boats, and missile launchers within a network of tunnels and caves along its southern coast. Iran has built "underground missile cities" housing mobile launchers.

## Problem

Currently all IRGC units are placed in visible, known locations. There's no surprise element. Real-world, Iran hides assets in coastal tunnel networks — boats, missiles, and mines emerge from concealed positions. Adding hidden spawners creates uncertainty and map exploration incentives.

## Proposal

Hidden **tunnel entrances** on the Iranian coastline that are invisible until they activate. When a wave starts or the AI decides to attack, units emerge from tunnels — fast boats pour out, missiles launch from cave openings. Player can discover and destroy tunnel entrances to cut off spawn points, but they're camouflaged.

## Design

### Gameplay Mechanics
- 4-6 tunnel positions along the Iranian coast (pre-set, but hidden)
- Tunnels are invisible until they first activate (spawn a unit)
- Once revealed, tunnels can be attacked and destroyed (HP: 300)
- Destroyed tunnels stop spawning permanently — strategic reward for the player
- Tunnels respawn units on a cooldown (every 30-60 seconds)
- Different tunnel types: boat tunnel (spawns fast boats), missile cave (fires missiles), mine tunnel (launches minelayers)
- F-22 (feature 0016) can discover and bomb tunnels
- Adds a "fog of war" feeling — player doesn't know where the next attack comes from

### Visual Design
- Hidden: nothing visible, blends into coastline
- First activation: rock/cliff face splits open, units pour out, dust cloud
- Revealed: dark cave entrance with red glow inside, military camouflage netting partially torn
- Active: units streaming out, flashing interior lights
- Destroyed: collapsed rubble, smoke, fire, permanently closed
- Discovery by F-22: flyover reveals entrance with a "TUNNEL FOUND" marker

### Balance
| Stat | Value |
|------|-------|
| Tunnel HP | 300 |
| Number of tunnels | 4-6 on the map |
| Spawn cooldown | 30-60s per tunnel |
| Units per spawn | 2-3 fast boats OR 1 minelayer OR 1 missile volley |
| First activation | Minute 3-4 |

## Scope

### In Scope
- [ ] Tunnel entity (hidden, revealable, destructible)
- [ ] Tunnel activation animation (opening, units emerging)
- [ ] Different tunnel types (boats, missiles, minelayers)
- [ ] Destruction animation and permanent removal
- [ ] Map placement of tunnels along Iranian coast

### Out of Scope
- Player tunnels / underground layer
- Tunnel rebuilding by IRGC (once destroyed, gone forever)
- Interior tunnel view
