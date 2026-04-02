# Gameplay Balance Bundle

**Date:** 2026-04-02
**Status:** Approved

## Summary

Four independent gameplay changes: red enemy oil rigs, air unit warning system, destroyer targeting IRGC rigs, and global upgrades from deployment bar.

## Change 1: Red Enemy Oil Rigs

Apply `setTint(0xff6666)` to the rig sprite when `side === 'irgc'` in OilRig.js constructor. Tint the glowRing red (0xef5350) instead of blue. No new texture needed.

**Result:** Coalition rigs stay blue-accented, IRGC rigs glow red. Instantly distinguishable.

**Files:** `src/entities/OilRig.js`

## Change 2: Air Unit Warning System

### Remove Air Defense unlock gate
Remove `unlockTime: 180000` from `AIR_DEFENSE` in `src/config/units.js`. Players can build air defense from the start (gated only by 600 oil cost).

### Warning banner at 3:00
At `ADVANCED.UNLOCK_TIME_MS` (180000ms = 3:00), display a dramatic on-screen warning banner:
- Text: `"⚠ IRGC AIR UNITS INCOMING — DEPLOY AIR DEFENSE"`
- Same visual style as existing advanced weapons unlock banner (red warning, centered, fades after a few seconds)
- Displayed in GameScene

### Air units spawn at 3:10
IRGC cruise missiles and UAVs begin spawning 10 seconds after the warning (190000ms). The AIController delay for air unit timers shifts from `ADVANCED.UNLOCK_TIME_MS` to `ADVANCED.UNLOCK_TIME_MS + 10000`.

### Timeline
```
0:00        Air Defense available to player (no unlock gate)
3:00        WARNING banner on screen
3:00-3:10   10-second grace period
3:10        IRGC CruiseMissiles + UAVs begin spawning normally
```

**Files:** `src/config/units.js`, `src/config/constants.js`, `src/systems/AIController.js`, `src/scenes/GameScene.js`

## Change 3: Destroyers Target IRGC Oil Rigs

Add IRGC oil rigs to Destroyer's `findNearestEnemy()` target search. IRGC rigs are accessed via `scene.economy.irgcRigs` (array of OilRig instances).

**Priority order (updated):**
1. Mines (immediate threat — highest priority)
2. IRGC Towers (weapons platforms)
3. IRGC Oil Rigs (enemy economy)
4. IRGC Boats (mobile threats — lowest priority)

**Files:** `src/entities/Destroyer.js`

## Change 4: Global Upgrades from Deployment Bar

### Global upgrade storage
Add `globalUpgrades` object to GameScene:
```js
this.globalUpgrades = {
  OIL_RIG: {},
  TANKER: {},
  DESTROYER: {},
  AIR_DEFENSE: {},
};
```

Each key maps to `{ UPGRADE_KEY: level }`. Initialized to empty (all level 0).

### Purchase flow
When a player buys an upgrade (from either the deployment bar or a deployed unit):
1. Increment `globalUpgrades[unitType][upgradeKey]`
2. Deduct oil cost from coalition economy
3. Iterate ALL existing coalition units of that type and call `applyUpgrade(upgradeKey)` on each
4. Show upgrade confirmation message

### New unit inheritance
When a new coalition unit is created, apply all current global upgrade levels from `globalUpgrades[unitType]`. In the entity constructor or immediately after placement, iterate the global upgrades and call `applyUpgrade()` for each upgrade that has level > 0.

### Deployment bar integration
Currently clicking a deployment bar card calls `upgradePanel.showPreview(unit)` which shows grayed-out upgrades. Change this to show a **functional** upgrade panel:
- Shows current global upgrade levels for that unit type
- Buying an upgrade applies globally (not per-instance)
- Panel header shows unit type name (not "PREVIEW")
- Upgrade rows are clickable/purchasable (not grayed out)

### Deployed unit click integration (kept)
Clicking a deployed unit still opens the upgrade panel. But now it shows the same global upgrade levels and buying applies globally. The per-instance `unit.upgrades` object is replaced by a reference to `globalUpgrades[unitType]`.

### Entity changes
Each entity's `upgrades` property becomes a getter that reads from `scene.globalUpgrades[unitType]` instead of maintaining its own object. The `applyUpgrade()` method stays on each entity class (it applies stat changes based on upgrade level).

**Files:** `src/scenes/GameScene.js`, `src/ui/UpgradePanel.js`, `src/ui/DeploymentBar.js`, `src/entities/OilRig.js`, `src/entities/Ship.js`, `src/entities/Destroyer.js`, `src/entities/AirDefense.js`
