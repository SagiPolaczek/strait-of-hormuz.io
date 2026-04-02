# Feature: Unit Upgrades (Skills)

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

Once a unit is placed, the player has no way to improve it. The only strategic choice is "buy more stuff." This makes mid-game feel flat — there's no sense of progression or investment in individual units. Players should feel rewarded for keeping units alive and be able to specialize their strategy.

## Proposal

Players can spend oil to upgrade placed units, unlocking incremental stat boosts. Upgrades give the player a reason to protect and invest in existing units rather than always spamming new ones.

### Upgradeable Stats

| Unit | Upgrade | Effect | Levels |
|------|---------|--------|--------|
| Oil Rig | Storage Capacity | +50% max storage per level | 3 |
| Oil Rig | Drill Rate | +30% oil generation per level | 3 |
| Tanker | Reinforced Hull | +40% max HP per level | 2 |
| Tanker | Engine Boost | +25% speed per level | 2 |
| Destroyer | Heavy Armament | +30% damage per level | 3 |
| Destroyer | Hardened Armor | +35% max HP per level | 2 |
| Destroyer | Fire Control | -20% fire cooldown per level | 2 |

## Design

### Gameplay Mechanics

- Tap/click a placed unit to open a small radial or popup upgrade menu
- Each upgrade level has an increasing oil cost (e.g. base cost * level multiplier)
- Upgrades are per-unit instance, not global
- Upgraded units get a small visual indicator (chevrons, glow color shift, or size increase)
- If a unit is destroyed, its upgrades are lost — makes protection matter

### Visual Design

- **Upgrade panel: LEFT side of screen** — a vertical sidebar/column showing available upgrades for the selected unit, always docked to the left edge
- Panel appears when a placed unit is tapped/clicked, slides in from left
- Each upgrade shown as a card/row: icon, name, current level pips, cost, buy button
- When no unit is selected, the panel is hidden or shows a collapsed "SELECT UNIT" hint
- Each upgrade level adds a small chevron/pip below the HP bar on the unit itself
- Stat boost shown as floating text on purchase ("+30% DMG", "+HP")
- Upgraded units get subtle visual changes:
  - Oil Rig: larger glow ring, more active pump animation
  - Tanker: thicker hull outline, more cargo markings
  - Destroyer: larger turret, brighter blue accent
- "MAX" badge when fully upgraded

### Balance

- Base upgrade costs (per level):
  - Oil Rig Storage: 150 / 250 / 400
  - Oil Rig Drill Rate: 200 / 350 / 550
  - Tanker Hull: 150 / 300
  - Tanker Speed: 200 / 400
  - Destroyer Damage: 200 / 350 / 500
  - Destroyer Armor: 175 / 350
  - Destroyer Fire Rate: 250 / 450
- Upgrades should feel impactful but not make the game trivial — IRGC escalation should still outpace a player who only upgrades without expanding

## Scope

### In Scope
- [ ] Upgrade data config (stats, costs, max levels per unit type)
- [ ] Tap-on-unit interaction to open upgrade menu
- [ ] Upgrade menu UI (shows available upgrades, costs, current level)
- [ ] Apply stat changes to unit instances on purchase
- [ ] Visual indicators for upgraded units (chevrons/pips)
- [ ] Floating text feedback on upgrade purchase

### Out of Scope
- Global/permanent upgrades that persist across games
- IRGC unit upgrades (AI doesn't need this complexity yet)
- Upgrade trees with branching paths

## Dependencies
- Existing unit tap interaction (currently only oil rigs respond to taps for collection — need to distinguish "collect" vs "upgrade" intent)

## Risks
- **UX conflict**: Tapping oil rigs currently collects oil. Need clear UX to separate "collect" from "upgrade" — maybe long-press or a dedicated upgrade mode toggle.
- **Balance**: Over-upgraded destroyers could trivialize IRGC launchers. May need to tune escalation to compensate.
- **Screen clutter**: Upgrade menus on small-ish units could feel cramped. Keep the UI minimal.

## Alternatives Considered
- **Global upgrades (tech tree)**: Simpler but less interesting — removes per-unit investment decisions. Could revisit later.
- **Passive auto-upgrades over time**: Less engaging — player doesn't feel the agency of choosing what to upgrade.
