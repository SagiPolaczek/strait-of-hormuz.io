# Gameplay Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 gameplay issues: land building zone, fast boat timing, IRGC intel, submarine patrol, closest-route ships, game-over polish, and share-only-image.

**Architecture:** Config-driven changes (zones, constants, units, intel) plus behavioral overrides in CoalitionSubmarine and GameScene routing. GameOverScene gets a rewrite of the animation sequencing. All changes are independent and can be built/tested in isolation.

**Tech Stack:** Phaser 3, vanilla JS (ES modules), Vite

---

### Task 1: Add COALITION_LAND zone and move buildings to it

**Files:**
- Modify: `src/config/zones.js` (add zone polygon)
- Modify: `src/config/units.js:38-59` (change AIR_DEFENSE + AIRFIELD zone)
- Modify: `src/systems/ZoneManager.js:107-113` (flash helper)
- Modify: `src/scenes/GameScene.js:481-486` (zone outline mapping)

- [ ] **Step 1: Add COALITION_LAND zone to zones.js**

Add after the `COALITION_DEPLOY` zone definition (after line 57):

```js
  // Coalition builds land structures here — Oman/UAE coast (bottom-left)
  COALITION_LAND: {
    color: 0x8bc34a,
    alpha: 0.12,
    polygon: [
      [6, 1250], [199, 1255], [290, 1184], [411, 1057],
      [559, 961], [684, 850], [777, 755], [862, 710],
      [942, 660], [1021, 511], [1039, 503], [1048, 517],
      [1059, 513], [1069, 470], [1083, 457], [1120, 460],
      [1146, 453], [1162, 462], [1143, 571], [1134, 630],
      [1069, 731], [1094, 765], [1102, 860], [1104, 1012],
      [1217, 1194], [1390, 1385], [1576, 1440], [1627, 1438],
      [1652, 1466], [1758, 1473], [1836, 1512], [1914, 1490],
      [1919, 1539], [0, 1539],
    ],
  },
```

This polygon traces the southern/Oman coastline below the ship channel and extends to the map edges.

- [ ] **Step 2: Update AIR_DEFENSE and AIRFIELD zones in units.js**

In `src/config/units.js`, change line 47 and line 57:

```js
  AIR_DEFENSE: {
    // ... existing fields ...
    zone: 'COALITION_LAND',   // was 'COALITION_DEPLOY'
    // ...
  },
  AIRFIELD: {
    // ... existing fields ...
    zone: 'COALITION_LAND',   // was 'COALITION_DEPLOY'
    // ...
  },
```

- [ ] **Step 3: Update ZoneManager.flashCoalitionZones**

In `src/systems/ZoneManager.js`, replace lines 107-113:

```js
  flashCoalitionZones(unitKey) {
    if (unitKey === 'OIL_RIG') {
      this.flashZone('COALITION_OIL');
    } else if (unitKey === 'AIR_DEFENSE' || unitKey === 'AIRFIELD') {
      this.flashZone('COALITION_LAND');
    } else {
      this.flashZone('COALITION_DEPLOY');
    }
  }
```

- [ ] **Step 4: Update GameScene.showZoneOutlines**

In `src/scenes/GameScene.js`, replace lines 481-486:

```js
  showZoneOutlines(unitKey) {
    this._clearZoneOutlines();
    let zoneName;
    if (unitKey === 'OIL_RIG') zoneName = 'COALITION_OIL';
    else if (unitKey === 'AIR_DEFENSE' || unitKey === 'AIRFIELD') zoneName = 'COALITION_LAND';
    else zoneName = 'COALITION_DEPLOY';
    const outlines = this.zoneManager.createZoneOutlines(zoneName);
    this._zoneOutlines = outlines;
  }
```

- [ ] **Step 5: Build and verify**

Run: `npx vite build`
Expected: Build succeeds. Then run `npx vite dev`, place an Air Defense — it should only accept clicks on the southern coastline.

- [ ] **Step 6: Commit**

```bash
git add src/config/zones.js src/config/units.js src/systems/ZoneManager.js src/scenes/GameScene.js
git commit -m "feat: add COALITION_LAND zone for Air Defense and Airfield placement"
```

---

### Task 2: Align fast boat timing to 3 minutes + update banner

**Files:**
- Modify: `src/config/constants.js:49` (FAST_BOAT_START_MS)
- Modify: `src/scenes/GameScene.js:349-361` (_onAdvancedUnlock banner text)

- [ ] **Step 1: Change FAST_BOAT_START_MS**

In `src/config/constants.js`, change line 49:

```js
  FAST_BOAT_START_MS: 180000,   // was 120000 — aligned with advanced unlock
```

- [ ] **Step 2: Update the advanced unlock banner**

In `src/scenes/GameScene.js`, replace the banner text in `_onAdvancedUnlock()` (lines 352-361):

```js
    const banner = this.add.text(960, 450, '⚠ ADVANCED THREATS INCOMING ⚠', {
      fontSize: '32px', fontFamily: '"Black Ops One", cursive',
      color: '#ef5350', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(200);

    const sub = this.add.text(960, 495, 'MISSILES • DRONES • FAST BOATS — DEPLOY DEFENSES NOW', {
      fontSize: '14px', fontFamily: '"Share Tech Mono", monospace',
      color: '#ff9800', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(200).setAlpha(0);
```

- [ ] **Step 3: Build and verify**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/config/constants.js src/scenes/GameScene.js
git commit -m "feat: align fast boat swarms to 3-min advanced unlock"
```

---

### Task 3: Add FastBoat and MiniSubmarine enemy intel

**Files:**
- Modify: `src/config/enemyIntel.js` (add 3 entries + update getIntelKey)

- [ ] **Step 1: Add intel entries**

In `src/config/enemyIntel.js`, add after the `OIL_RIG_IRGC` entry (before the closing `};` on line 75):

```js
  FAST_BOAT_GUN: {
    name: 'IRGC Gun Boat',
    icon: '🚤',
    type: 'SURFACE THREAT',
    color: '#78909c',
    maxHP: 50,
    stats: [
      { label: 'DAMAGE', value: '8 per shot' },
      { label: 'FIRE RATE', value: 'Every 0.8s' },
      { label: 'SPEED', value: 'Fast (150)' },
      { label: 'BEHAVIOR', value: 'Orbits and strafes' },
    ],
    desc: 'Fast attack craft armed with a mounted gun. Circles coalition ships at close range, delivering sustained fire. Arrives in swarms of 5-15.',
    counter: 'Destroyers are the primary counter — their shells outrange gun boats. Upgrade Armament for faster kills.',
  },

  FAST_BOAT_SUICIDE: {
    name: 'IRGC Suicide Boat',
    icon: '💥',
    type: 'SURFACE THREAT',
    color: '#8b1a1a',
    maxHP: 30,
    stats: [
      { label: 'DAMAGE', value: '100 on impact' },
      { label: 'SPEED', value: 'Very fast (200)' },
      { label: 'BEHAVIOR', value: 'Rams target' },
    ],
    desc: 'Explosive-laden speedboat that charges straight at the nearest coalition asset. Fragile but devastating on impact — one hit cripples most ships.',
    counter: 'Destroyers can shoot them down before impact. Prioritize Engine upgrades on tankers to outrun them.',
  },

  MINI_SUBMARINE: {
    name: 'IRGC Mini-Sub',
    icon: '🔻',
    type: 'SUBSURFACE THREAT',
    color: '#f44336',
    maxHP: 80,
    stats: [
      { label: 'TORPEDO DMG', value: '100' },
      { label: 'SPEED', value: '70 (submerged)' },
      { label: 'SURFACE TIME', value: '4s to fire' },
      { label: 'DIVE COOLDOWN', value: '12s' },
    ],
    desc: 'Midget submarine that stalks coalition ships while submerged. Surfaces briefly to fire a torpedo, then dives again. Invisible unless detected by sonar.',
    counter: 'Deploy Coalition Submarines — their sonar reveals mini-subs, making them targetable by Destroyers.',
  },
```

- [ ] **Step 2: Update getIntelKey() to detect new unit types**

In `src/config/enemyIntel.js`, replace the `getIntelKey` function (lines 80-89):

```js
export function getIntelKey(unit) {
  if (unit.isMine) return 'MINE';
  if (unit.isAirTarget) {
    return unit.speed >= 150 ? 'EXPLODING_UAV' : 'CRUISE_MISSILE';
  }
  if (unit.isSub) return 'MINI_SUBMARINE';
  if (unit.isBoat) {
    return unit.variant === 'suicide' ? 'FAST_BOAT_SUICIDE' : 'FAST_BOAT_GUN';
  }
  if (unit.stats?.key === 'MISSILE_LAUNCHER') return 'MISSILE_LAUNCHER';
  if (unit.stats?.key === 'OIL_RIG' && unit.side === 'irgc') return 'OIL_RIG_IRGC';
  return null;
}
```

- [ ] **Step 3: Build and verify**

Run: `npx vite build`
Expected: Build succeeds. Then run dev, click on a fast boat or mini-sub — intel panel should appear.

- [ ] **Step 4: Commit**

```bash
git add src/config/enemyIntel.js
git commit -m "feat: add enemy intel for fast boats and mini-submarines"
```

---

### Task 4: Convert CoalitionSubmarine from route-following to patrol behavior

**Files:**
- Modify: `src/entities/CoalitionSubmarine.js` (replace update logic)
- Read: `src/config/zones.js` (WATER_POLYGON for patrol bounds)

- [ ] **Step 1: Add WATER_POLYGON import and patrol state**

In `src/entities/CoalitionSubmarine.js`, add to the imports at the top:

```js
import { WATER_POLYGON } from '../config/zones.js';
```

Add patrol state to the constructor, after `this.upgrades = {};` (line 12):

```js
    // Patrol behavior (overrides Ship route-following)
    this.patrolState = 'PATROL'; // PATROL or PURSUE
    this.patrolTarget = null; // {x, y} point to patrol toward

    // Cache water polygon geometry for patrol point sampling
    const waterPoints = WATER_POLYGON.map(([px, py]) => new Phaser.Geom.Point(px, py));
    this._waterGeom = new Phaser.Geom.Polygon(waterPoints);

    this._pickPatrolPoint();
```

- [ ] **Step 2: Add patrol point selection method**

Add after the constructor:

```js
  _pickPatrolPoint() {
    // Random point inside WATER_POLYGON using rejection sampling
    // Bias toward central strait (x: 400-1400, y: 400-1000) for gameplay relevance
    const bounds = { minX: 100, maxX: 1800, minY: 350, maxY: 1200 };
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(bounds.minX, bounds.maxX);
      const y = Phaser.Math.Between(bounds.minY, bounds.maxY);
      if (Phaser.Geom.Polygon.Contains(this._waterGeom, x, y)) {
        this.patrolTarget = { x, y };
        return;
      }
    }
    // Fallback: center of map (always in water)
    this.patrolTarget = { x: 800, y: 700 };
  }
```

- [ ] **Step 3: Override update() with patrol logic**

Replace the existing `update()` method (line 57-83):

```js
  update() {
    if (!this.alive) return;
    const now = this.scene.time.now;

    // --- Sonar detection ---
    this._updateSonar();

    // --- Patrol / Pursue behavior ---
    const enemy = this._findTarget();

    if (enemy) {
      this.patrolState = 'PURSUE';
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = this.getEffectiveSpeed();

      if (dist > 40) {
        if (this.body) this.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
      } else {
        if (this.body) this.body.setVelocity(0, 0);
      }

      // Fire torpedoes
      if (now - this.lastFired >= this.getEffectiveFireRate()) {
        if (dist < this.stats.range) {
          this.lastFired = now;
          const config = { ...PROJECTILES.TORPEDO, damage: this.getEffectiveDamage() };
          this.scene.fireProjectile(this.x, this.y, enemy, config, 'coalition');
          this._torpedoFlash();
        }
      }
    } else {
      this.patrolState = 'PATROL';
      if (!this.patrolTarget) this._pickPatrolPoint();

      const dx = this.patrolTarget.x - this.x;
      const dy = this.patrolTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = this.getEffectiveSpeed() * 0.6; // slower patrol speed

      if (dist < 30) {
        this._pickPatrolPoint(); // reached patrol point, pick next
      } else {
        if (this.body) this.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }
    }

    // --- Wake emitter position ---
    if (this.wakeEmitter?.active) {
      const rad = this.rotation;
      this.wakeEmitter.setPosition(this.x - Math.cos(rad) * 16, this.y - Math.sin(rad) * 16);
    }

    // --- Sonar range ring (update only when range changes) ---
    if (this._sonarDirty !== this.getEffectiveSonarRange()) {
      this._sonarDirty = this.getEffectiveSonarRange();
      this.sonarRingGfx.clear();
      this.sonarRingGfx.lineStyle(1, 0x42a5f5, 0.08);
      this.sonarRingGfx.strokeCircle(0, 0, this._sonarDirty);
    }

    // --- Sonar pulse visual (every 3s) ---
    if (now - this.sonarPulseTime > 3000) {
      this.sonarPulseTime = now;
      this._sonarPulse();
    }
  }
```

- [ ] **Step 4: Remove onReachedEnd override**

Delete the `onReachedEnd()` method (lines 181-187 in the original). The sub no longer follows routes, so it never reaches an "end." Keep the `destroy()` method that calls `_clearSonarDetections()`.

- [ ] **Step 5: Build and verify**

Run: `npx vite build`
Expected: Build succeeds. In dev, deploy a submarine — it should wander the bay and engage enemies rather than sailing to the exit.

- [ ] **Step 6: Commit**

```bash
git add src/entities/CoalitionSubmarine.js
git commit -m "feat: convert coalition submarine to patrol behavior"
```

---

### Task 5: Add more ship routes + closest-route selection

**Files:**
- Modify: `src/config/zones.js` (add 4 new routes)
- Modify: `src/scenes/GameScene.js:267-282` (deployShip closest-route logic)

- [ ] **Step 1: Add 4 new ship routes**

In `src/config/zones.js`, add after Route D (after line 152, before the `];`):

```js
  // Route E: Far south — Oman coastal hug (safest, longest path)
  [
    [140, 1050], [350, 850],  [560, 700],  [750, 650],
    [930, 500],  [1090, 430], [1280, 500], [1480, 800],
    [1760, 840], [1900, 1100],
  ],
  // Route F: North-central — weaves between islands (moderate risk)
  [
    [70, 700],   [200, 580],  [420, 500],  [640, 490],
    [830, 390],  [1060, 340], [1240, 380], [1440, 710],
    [1680, 770], [1900, 850],
  ],
  // Route G: Mid-channel express — direct center line (fastest, most exposed)
  [
    [110, 800],  [280, 650],  [510, 560],  [730, 530],
    [930, 410],  [1110, 360], [1310, 450], [1510, 760],
    [1790, 810], [1900, 940],
  ],
  // Route H: Southern island dodge — skirts south of Qeshm (avoids towers)
  [
    [130, 900],  [320, 780],  [540, 640],  [760, 600],
    [960, 470],  [1130, 420], [1350, 490], [1540, 790],
    [1770, 830], [1900, 1000],
  ],
```

- [ ] **Step 2: Replace random route selection with closest-route**

In `src/scenes/GameScene.js`, replace `deployShip` (lines 267-282):

```js
  deployShip(clickX, clickY, stats, ShipClass) {
    // Pick the route whose start is closest to the click position
    let bestRoute = SHIP_ROUTES[0];
    let bestDist = Infinity;
    for (const route of SHIP_ROUTES) {
      const [sx, sy] = route[0];
      const dist = Phaser.Math.Distance.Between(clickX, clickY, sx, sy);
      if (dist < bestDist) {
        bestDist = dist;
        bestRoute = route;
      }
    }
    // If two routes tie (within 50px), add slight randomness
    const candidates = SHIP_ROUTES.filter(route => {
      const [sx, sy] = route[0];
      return Phaser.Math.Distance.Between(clickX, clickY, sx, sy) < bestDist + 50;
    });
    const route = candidates[Math.floor(Math.random() * candidates.length)];

    const [startX, startY] = route[0];
    const ship = new ShipClass(this, startX, startY, stats);
    ship.waypoints = [...route];
    this.coalitionShips.add(ship);
    this._applyGlobalUpgrades(ship);

    this.showPlacementConfirmation(clickX, clickY);
    this.showDeployIndicator(startX, startY);
    this.audio.place();
  }
```

- [ ] **Step 3: Update deploySubmarine to also use closest-route fallback for spawn position**

In `src/scenes/GameScene.js`, update `deploySubmarine` (lines 325-335). Since the sub now patrols, we just spawn it near the click — but still within water:

```js
  deploySubmarine(clickX, clickY, stats) {
    // Spawn near the click, but pick the closest route start for a valid water position
    let bestRoute = SHIP_ROUTES[0];
    let bestDist = Infinity;
    for (const route of SHIP_ROUTES) {
      const [sx, sy] = route[0];
      const dist = Phaser.Math.Distance.Between(clickX, clickY, sx, sy);
      if (dist < bestDist) { bestDist = dist; bestRoute = route; }
    }
    const [startX, startY] = bestRoute[0];
    const sub = new CoalitionSubmarine(this, startX, startY, stats);
    this.coalitionShips.add(sub);
    this._applyGlobalUpgrades(sub);
    this.showPlacementConfirmation(clickX, clickY);
    this.showDeployIndicator(startX, startY);
    this.audio.place();
  }
```

- [ ] **Step 4: Build and verify**

Run: `npx vite build`
Expected: Build succeeds. In dev, click near the southern coast to deploy a ship — it should pick a southern route.

- [ ] **Step 5: Commit**

```bash
git add src/config/zones.js src/scenes/GameScene.js
git commit -m "feat: add 4 ship routes, deploy ships via closest route to click"
```

---

### Task 6: Fix GameOverScene animation bugs + visual polish

**Files:**
- Modify: `src/scenes/GameOverScene.js` (rewrite animation sequencing)

- [ ] **Step 1: Fix the bulk fade-in bug**

In `src/scenes/GameOverScene.js`, delete BOTH catch-all delayedCall blocks.

Delete lines 146-152 (first occurrence):
```js
    // Fade in stats together
    this.time.delayedCall(1500, () => {
      this.children.list.forEach(c => {
        if (c.depth === 212 && c.alpha === 0) {
          this.tweens.add({ targets: c, alpha: 1, duration: 400 });
        }
      });
    });
```

Delete lines 359-366 (second occurrence):
```js
    // Fade in all remaining depth-212 elements
    this.time.delayedCall(1500, () => {
      this.children.list.forEach(c => {
        if (c.alpha === 0 && c.depth >= 210) {
          this.tweens.add({ targets: c, alpha: c._targetAlpha || 1, duration: 400 });
        }
      });
    });
```

- [ ] **Step 2: Add explicit per-element fade-in tweens**

Replace the deleted code with explicit, sequenced animations. After the balance meter section (around line 162), add:

```js
    // ── Staggered reveal: explicit per-element tweens ──
    const fadeIn = (targets, delay, alpha = 1) => {
      const arr = Array.isArray(targets) ? targets : [targets];
      arr.forEach(t => {
        this.tweens.add({ targets: t, alpha, duration: 400, delay });
      });
    };
```

Then for each unnamed element that was relying on the catch-all, save references and use `fadeIn`:

For the duration label (line 137-139), save it:
```js
    const durLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 170, 'MISSION DURATION', {
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#90CAF9',
    }).setDepth(212).setAlpha(0);
```

Then add explicit tweens:
```js
    fadeIn([durLabel, durValue], 1700);
```

For the balance/reason/rating/leaderboard sections, save each reference and add:
```js
    fadeIn([balLabel, balValue], 1800);
    fadeIn(reasonTextObj, 1900);
    fadeIn([ratingLabel, ratingValue], 2000);
    fadeIn(debriefLabel, 1400, 0.6);   // partial alpha!
    fadeIn([hr1, hr2, hr3], 1500);
    fadeIn(footerText, 2800, 0.3);     // partial alpha!
```

- [ ] **Step 3: Fix hit-area rectangles — never animate their alpha**

Remove `retryHit` and `saveHit` from the button fade-in tween (line 343-346). Replace:

```js
    // Animate buttons in (NOT hit-areas — they stay invisible)
    this.tweens.add({
      targets: [retryBg, retryText, saveBg, saveText],
      alpha: 1, duration: 400, delay: 2700,
    });
    // Hit areas: make interactive immediately but keep invisible
    this.time.delayedCall(2700, () => {
      retryHit.setAlpha(0.001); // near-invisible but Phaser needs >0 for interaction
      saveHit.setAlpha(0.001);
    });
```

- [ ] **Step 4: Add subtle map background animation**

At the top of `create()`, after the dark overlay, add a slow-panning map background:

```js
    // ── Faded satellite map background with slow pan ──
    const mapBg = this.add.image(cx, H / 2, 'map').setDisplaySize(2100, 1680).setDepth(199).setAlpha(0);
    this.tweens.add({ targets: mapBg, alpha: 0.08, duration: 2000 });
    this.tweens.add({
      targets: mapBg, x: cx - 40, y: H / 2 - 20,
      duration: 30000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
```

- [ ] **Step 5: Add pulsing border glow on the debrief card**

After drawing the card background, add a glowing border pulse:

```js
    // Pulsing accent border
    const cardGlow = this.add.graphics().setDepth(210.5).setAlpha(0);
    cardGlow.lineStyle(2, accentHex, 0.6);
    cardGlow.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 6);
    this.tweens.add({ targets: cardGlow, alpha: 1, duration: 600, delay: 1200 });
    this.tweens.add({
      targets: cardGlow, alpha: { from: 0.8, to: 0.3 },
      duration: 1500, yoyo: true, repeat: -1, delay: 1800,
    });
```

- [ ] **Step 6: Build and verify**

Run: `npx vite build`
Expected: Build succeeds. Play a game to game over — verify no black rectangles appear, stats fade in smoothly with proper spacing and timing, map pans gently in background.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameOverScene.js
git commit -m "fix: rewrite GameOverScene animations, fix fade-in bugs, add visual polish"
```

---

### Task 7: Share only image (remove text from navigator.share)

**Files:**
- Modify: `src/ui/DebriefRenderer.js:288-291`

- [ ] **Step 1: Remove text and title from share call**

In `src/ui/DebriefRenderer.js`, replace lines 288-291:

```js
        await navigator.share({
          files: [file],
        });
```

Remove the `title` and `text` fields entirely. The debrief PNG already contains all context.

- [ ] **Step 2: Build and verify**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/ui/DebriefRenderer.js
git commit -m "fix: share only the debrief image, remove text metadata"
```

---

## Task Dependency Summary

All 7 tasks are **independent** and can be executed in any order or in parallel. No task depends on another.

| Task | Files | Risk |
|------|-------|------|
| 1. Land zone | zones.js, units.js, ZoneManager.js, GameScene.js | Low — config + routing |
| 2. Fast boat timing | constants.js, GameScene.js | Low — constant change + text |
| 3. Enemy intel | enemyIntel.js | Low — pure config addition |
| 4. Submarine patrol | CoalitionSubmarine.js | Medium — behavioral rewrite |
| 5. Ship routes | zones.js, GameScene.js | Low — config + selection logic |
| 6. Game over polish | GameOverScene.js | Medium — animation rewrite |
| 7. Share image only | DebriefRenderer.js | Low — 3-line change |
