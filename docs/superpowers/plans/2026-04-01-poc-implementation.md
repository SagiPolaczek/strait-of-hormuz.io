# Strait of Hormuz Tower Defense — POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable browser POC: satellite map background, oil economy, deploy tankers/destroyers through the strait, IRGC AI places missile launchers that fire at ships, HUD, game over screen.

**Architecture:** Phaser.js 3 game with modular entity/system/scene architecture. Each game concept (economy, AI, combat, zones) is its own manager class. Entities (ships, towers, rigs) are self-contained Phaser GameObjects. Config files hold all tunable constants so balancing never touches logic code.

**Tech Stack:** Phaser 3, Vite, vanilla JS (no TypeScript for POC speed)

---

## File Structure

```
strait_of_hormuz_tower_defense/
├── index.html                    # Minimal HTML shell
├── package.json
├── vite.config.js
├── assets/
│   └── strait.jpg                # Satellite image (copy from Downloads)
├── src/
│   ├── main.js                   # Phaser.Game config + bootstrap
│   ├── config/
│   │   ├── constants.js          # Game-wide tuning: speeds, timings, starting oil
│   │   ├── units.js              # Unit stat definitions (cost, hp, speed, damage)
│   │   └── zones.js              # Zone polygon coordinates on the 1920x1539 map
│   ├── scenes/
│   │   ├── BootScene.js          # Preload assets, show loading bar
│   │   ├── GameScene.js          # Main game loop — owns all managers, entities
│   │   └── GameOverScene.js      # Score display, restart button, satirical headline
│   ├── entities/
│   │   ├── OilRig.js             # Oil rig sprite + oil generation tick (both sides)
│   │   ├── Ship.js               # Base ship: movement along waypoints, HP, damage
│   │   ├── Tanker.js             # Extends Ship: slow, high value, scores on exit
│   │   ├── Destroyer.js          # Extends Ship: armed, shoots at nearby enemies
│   │   ├── MissileLauncher.js    # IRGC tower: targets nearest ship, fires projectile
│   │   └── Projectile.js         # Missile sprite: flies toward target, deals damage
│   ├── systems/
│   │   ├── EconomyManager.js     # Tracks oil for both sides, handles income/spending
│   │   ├── AIController.js       # IRGC decision loop: what to build, where, when
│   │   ├── ZoneManager.js        # Hit-test: is a point inside a zone polygon?
│   │   └── CombatManager.js      # Collision detection, damage application, cleanup
│   └── ui/
│       ├── HUD.js                # Top bar: oil, score, timer, threat level
│       └── DeploymentBar.js      # Bottom bar: clickable unit buttons with costs
```

**Module dependency graph (imports flow downward):**
```
main.js
  └── scenes/BootScene → scenes/GameScene → scenes/GameOverScene
        GameScene owns:
        ├── systems/EconomyManager   (no deps)
        ├── systems/ZoneManager      (imports config/zones)
        ├── systems/AIController     (imports EconomyManager, ZoneManager, config/units)
        ├── systems/CombatManager    (no deps — receives groups from GameScene)
        ├── ui/HUD                   (reads EconomyManager state)
        ├── ui/DeploymentBar         (imports config/units, calls GameScene methods)
        └── entities/*               (import config/units for their own stats)
```

**Key principle:** Config files hold ALL numbers. If you want to change tanker HP, speed, cost — it's one file (`config/units.js`). If you want to change zone boundaries — one file (`config/zones.js`). Logic code reads from config, never hardcodes values.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/scenes/BootScene.js`
- Copy: `assets/strait.jpg`

- [ ] **Step 1: Initialize project and install dependencies**

```bash
cd /Users/sagipolaczek/Documents/projects/strait_of_hormuz_tower_defense
npm init -y
npm install phaser
npm install -D vite
```

- [ ] **Step 2: Create vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 3: Create index.html**

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Strait of Hormuz Defense</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create src/main.js with Phaser config**

```js
// src/main.js
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1539;

const config = {
  type: Phaser.AUTO,
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
```

- [ ] **Step 5: Create BootScene — preload satellite image**

```js
// src/scenes/BootScene.js
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Loading bar
    const bar = this.add.rectangle(960, 770, 400, 20, 0x333333);
    const fill = this.add.rectangle(760, 770, 0, 16, 0x42a5f5);
    this.load.on('progress', (val) => {
      fill.width = 396 * val;
      fill.x = 760 + fill.width / 2;
    });

    this.load.image('map', 'assets/strait.jpg');
  }

  create() {
    this.scene.start('Game');
  }
}
```

- [ ] **Step 6: Create placeholder GameScene and GameOverScene**

```js
// src/scenes/GameScene.js
export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    // Satellite map background — centered, fills the game canvas
    this.add.image(960, 770, 'map').setDisplaySize(1920, 1539);
  }
}
```

```js
// src/scenes/GameOverScene.js
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create() {
    const { score, time } = this.scene.settings.data || { score: 0, time: '0:00' };
    this.add.rectangle(960, 770, 600, 400, 0x000000, 0.85).setStrokeStyle(2, 0xffffff);
    this.add.text(960, 650, '💥 GAME OVER 💥', { fontSize: '48px', fontFamily: 'Arial', color: '#ef5350' }).setOrigin(0.5);
    this.add.text(960, 730, `Tankers through: ${score}`, { fontSize: '28px', fontFamily: 'Arial', color: '#FFD54F' }).setOrigin(0.5);
    this.add.text(960, 780, `Survived: ${time}`, { fontSize: '24px', fontFamily: 'Arial', color: '#90CAF9' }).setOrigin(0.5);

    const btn = this.add.text(960, 870, '🔄 TRY AGAIN', { fontSize: '28px', fontFamily: 'Arial', color: '#4CAF50', backgroundColor: '#1b1b1b', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start('Game'));
  }
}
```

- [ ] **Step 7: Copy satellite image to assets/**

```bash
mkdir -p assets
cp ~/Downloads/Strait_of_Hormuz_and_Musandam_Peninsula_\(MODIS_2018-12-10\).jpg assets/strait.jpg
```

- [ ] **Step 8: Add dev script to package.json and verify**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Run `npm run dev`, open in browser. **Verify:** satellite map fills the screen with correct aspect ratio, black bars on sides if window doesn't match.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold project with Phaser.js, satellite map background"
```

---

## Task 2: Config Files (constants, units, zones)

**Files:**
- Create: `src/config/constants.js`
- Create: `src/config/units.js`
- Create: `src/config/zones.js`

All tunable numbers live here. Logic code imports these — never hardcodes values.

- [ ] **Step 1: Create constants.js**

```js
// src/config/constants.js
export const MAP = {
  WIDTH: 1920,
  HEIGHT: 1539,
};

export const ECONOMY = {
  COALITION_START_OIL: 1500,
  IRGC_START_OIL: 800,
  OIL_RIG_RATE: 2,           // oil per second per rig
  TANKER_BONUS: 500,          // oil earned when a tanker passes through
};

export const TIMING = {
  AI_TICK_MS: 3000,           // AI makes a decision every 3 seconds
  OIL_TICK_MS: 1000,          // oil generated every 1 second
  MISSILE_COOLDOWN_MS: 2500,  // launcher fires every 2.5 seconds
  DESTROYER_FIRE_RATE_MS: 1500,
};

export const ESCALATION = {
  // Minutes into the game → AI budget multiplier
  THRESHOLDS: [
    { time: 0, multiplier: 1.0 },
    { time: 2, multiplier: 1.5 },
    { time: 5, multiplier: 2.5 },
    { time: 10, multiplier: 4.0 },
  ],
};
```

- [ ] **Step 2: Create units.js**

```js
// src/config/units.js

export const COALITION_UNITS = {
  OIL_RIG: {
    key: 'OIL_RIG',
    name: 'Oil Rig',
    icon: '🛢️',
    cost: 500,
    hp: 200,
    oilRate: 2,      // oil per second
    zone: 'COALITION_OIL',
    type: 'building',
  },
  TANKER: {
    key: 'TANKER',
    name: 'Tanker',
    icon: '⛽',
    cost: 200,
    hp: 100,
    speed: 60,        // pixels per second
    zone: 'COALITION_DEPLOY',
    type: 'ship',
    scoreValue: 1,
    oilBonus: 500,
  },
  DESTROYER: {
    key: 'DESTROYER',
    name: 'Destroyer',
    icon: '🛥️',
    cost: 350,
    hp: 180,
    speed: 90,
    zone: 'COALITION_DEPLOY',
    type: 'ship',
    damage: 40,
    range: 200,       // pixels
    fireRate: 1500,   // ms between shots
  },
};

export const IRGC_UNITS = {
  OIL_RIG: {
    key: 'OIL_RIG',
    name: 'Oil Rig',
    icon: '🛢️',
    cost: 400,
    hp: 200,
    oilRate: 2,
    zone: 'IRGC_OIL',
    type: 'building',
  },
  MISSILE_LAUNCHER: {
    key: 'MISSILE_LAUNCHER',
    name: 'Missile Launcher',
    icon: '🚀',
    cost: 300,
    hp: 150,
    damage: 50,
    range: 350,
    fireRate: 2500,   // ms between shots
    zone: 'IRGC_BUILD',
    type: 'tower',
  },
};

export const PROJECTILES = {
  MISSILE: {
    speed: 250,
    damage: 50,
    color: 0xff4444,
    radius: 4,
  },
  DESTROYER_SHELL: {
    speed: 350,
    damage: 40,
    color: 0x42a5f5,
    radius: 3,
  },
};
```

- [ ] **Step 3: Create zones.js with polygon coordinates**

These polygons are mapped to the 1920x1539 satellite image. Coordinates are [x, y] pairs forming closed polygons.

```js
// src/config/zones.js
// All coordinates are on the 1920x1539 map space.
// Polygons defined as arrays of [x, y] points.

export const ZONES = {
  // Coalition builds oil rigs here — Gulf of Oman (southeast water)
  COALITION_OIL: {
    color: 0x2196f3,
    alpha: 0.12,
    polygon: [
      [1350, 750], [1900, 580], [1900, 900], [1650, 1050], [1350, 950],
    ],
  },

  // Coalition deploys ships here — entry point to the strait
  COALITION_DEPLOY: {
    color: 0x2196f3,
    alpha: 0.12,
    polygon: [
      [1200, 500], [1500, 400], [1600, 600], [1400, 750], [1200, 700],
    ],
  },

  // IRGC builds oil rigs here — Persian Gulf (northwest water)
  IRGC_OIL: {
    color: 0xf44336,
    alpha: 0.12,
    polygon: [
      [50, 200], [350, 150], [400, 350], [250, 450], [50, 400],
    ],
  },

  // IRGC builds towers here — Iran coast + islands
  IRGC_BUILD: {
    color: 0xf44336,
    alpha: 0.10,
    polygon: [
      [350, 50], [1200, 50], [1150, 250], [900, 320], [650, 300],
      [500, 280], [350, 200],
    ],
  },

  // The exit zone — tankers that reach here score
  EXIT: {
    color: 0x4caf50,
    alpha: 0.08,
    polygon: [
      [50, 350], [300, 300], [350, 500], [200, 550], [50, 500],
    ],
  },
};

// Predefined ship route: waypoints from deploy zone through the strait to the exit
export const DEFAULT_SHIP_ROUTE = [
  [1350, 550],   // Start: Gulf of Oman
  [1150, 450],   // Approach strait
  [900, 380],    // Enter strait
  [650, 350],    // Mid-strait (kill zone)
  [400, 380],    // Past Qeshm
  [200, 420],    // Approaching exit
];

// IRGC tower placement spots — predefined positions on islands/coast
export const IRGC_BUILD_SPOTS = [
  { x: 780, y: 230, label: 'Iran Coast West' },
  { x: 950, y: 200, label: 'Iran Coast East' },
  { x: 700, y: 310, label: 'Qeshm West' },
  { x: 820, y: 290, label: 'Qeshm East' },
  { x: 1020, y: 260, label: 'Hormuz Island' },
  { x: 1120, y: 310, label: 'Larak Island' },
  { x: 450, y: 350, label: 'Abu Musa' },
  { x: 550, y: 250, label: 'Coast Central' },
];
```

- [ ] **Step 4: Verify imports work**

In `GameScene.create()`, temporarily add:
```js
import { ZONES } from '../config/zones.js';
console.log('Zones loaded:', Object.keys(ZONES));
```
Run dev server, check console. Remove temp log after verifying.

- [ ] **Step 5: Commit**

```bash
git add src/config/
git commit -m "feat: add config files — constants, unit stats, zone polygons"
```

---

## Task 3: Zone Manager — Polygon Hit-Testing & Zone Rendering

**Files:**
- Create: `src/systems/ZoneManager.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create ZoneManager.js**

```js
// src/systems/ZoneManager.js
import { ZONES } from '../config/zones.js';

export class ZoneManager {
  constructor(scene) {
    this.scene = scene;
    this.zoneGraphics = {};
    this.drawZones();
  }

  drawZones() {
    Object.entries(ZONES).forEach(([key, zone]) => {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(zone.color, zone.alpha);
      gfx.lineStyle(2, zone.color, 0.4);

      const points = zone.polygon.map(([x, y]) => new Phaser.Geom.Point(x, y));
      const polygon = new Phaser.Geom.Polygon(points);

      gfx.fillPoints(polygon.points, true);
      gfx.strokePoints(polygon.points, true);

      this.zoneGraphics[key] = { graphic: gfx, geom: polygon };
    });
  }

  isInZone(zoneName, x, y) {
    const zone = this.zoneGraphics[zoneName];
    if (!zone) return false;
    return Phaser.Geom.Polygon.Contains(zone.geom, x, y);
  }

  getZoneAt(x, y) {
    for (const [key, zone] of Object.entries(this.zoneGraphics)) {
      if (Phaser.Geom.Polygon.Contains(zone.geom, x, y)) {
        return key;
      }
    }
    return null;
  }
}
```

- [ ] **Step 2: Wire ZoneManager into GameScene**

```js
// src/scenes/GameScene.js
import { ZoneManager } from '../systems/ZoneManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.add.image(960, 770, 'map').setDisplaySize(1920, 1539);
    this.zoneManager = new ZoneManager(this);
  }
}
```

- [ ] **Step 3: Verify zones render on the map**

Run dev server. **Verify:** semi-transparent blue zones appear over the Gulf of Oman area, red zones over Iran coast / Persian Gulf. Zones should align roughly with the satellite geography.

- [ ] **Step 4: Commit**

```bash
git add src/systems/ZoneManager.js src/scenes/GameScene.js
git commit -m "feat: add ZoneManager with polygon rendering and hit-testing"
```

---

## Task 4: Economy Manager

**Files:**
- Create: `src/systems/EconomyManager.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Create EconomyManager.js**

```js
// src/systems/EconomyManager.js
import { ECONOMY, TIMING } from '../config/constants.js';

export class EconomyManager {
  constructor(scene) {
    this.scene = scene;
    this.coalitionOil = ECONOMY.COALITION_START_OIL;
    this.irgcOil = ECONOMY.IRGC_START_OIL;
    this.coalitionRigs = [];   // references to OilRig entities
    this.irgcRigs = [];

    // Tick oil generation
    this.scene.time.addEvent({
      delay: TIMING.OIL_TICK_MS,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });
  }

  tick() {
    const coalitionIncome = this.coalitionRigs.length * ECONOMY.OIL_RIG_RATE;
    const irgcIncome = this.irgcRigs.length * ECONOMY.OIL_RIG_RATE;
    this.coalitionOil += coalitionIncome;
    this.irgcOil += irgcIncome;
  }

  canAfford(side, cost) {
    return side === 'coalition'
      ? this.coalitionOil >= cost
      : this.irgcOil >= cost;
  }

  spend(side, cost) {
    if (!this.canAfford(side, cost)) return false;
    if (side === 'coalition') {
      this.coalitionOil -= cost;
    } else {
      this.irgcOil -= cost;
    }
    return true;
  }

  earn(side, amount) {
    if (side === 'coalition') {
      this.coalitionOil += amount;
    } else {
      this.irgcOil += amount;
    }
  }

  registerRig(side, rig) {
    if (side === 'coalition') {
      this.coalitionRigs.push(rig);
    } else {
      this.irgcRigs.push(rig);
    }
  }

  unregisterRig(side, rig) {
    const arr = side === 'coalition' ? this.coalitionRigs : this.irgcRigs;
    const idx = arr.indexOf(rig);
    if (idx !== -1) arr.splice(idx, 1);
  }
}
```

- [ ] **Step 2: Wire into GameScene**

Add to `GameScene.create()`:
```js
import { EconomyManager } from '../systems/EconomyManager.js';

// Inside create():
this.economy = new EconomyManager(this);
```

- [ ] **Step 3: Verify economy ticks**

Add temp debug text in GameScene:
```js
this.debugText = this.add.text(10, 10, '', { fontSize: '16px', color: '#fff' });
// In update():
this.debugText.setText(`Oil: ${Math.floor(this.economy.coalitionOil)}`);
```
Run, verify oil number increases over time (only from starting amount initially — no rigs yet). Remove debug text after verifying.

- [ ] **Step 4: Commit**

```bash
git add src/systems/EconomyManager.js src/scenes/GameScene.js
git commit -m "feat: add EconomyManager — oil tracking, income ticks, spending"
```

---

## Task 5: Entities — OilRig, Ship, Tanker, Destroyer

**Files:**
- Create: `src/entities/OilRig.js`
- Create: `src/entities/Ship.js`
- Create: `src/entities/Tanker.js`
- Create: `src/entities/Destroyer.js`

- [ ] **Step 1: Create OilRig.js**

```js
// src/entities/OilRig.js
export class OilRig extends Phaser.GameObjects.Container {
  constructor(scene, x, y, side, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.side = side;
    this.stats = stats;
    this.hp = stats.hp;

    // Visual: circle + emoji
    const color = side === 'coalition' ? 0x2196f3 : 0xf44336;
    this.base = scene.add.circle(0, 0, 20, color, 0.6).setStrokeStyle(2, color);
    this.label = scene.add.text(0, 0, stats.icon, { fontSize: '24px' }).setOrigin(0.5);
    this.add([this.base, this.label]);

    // HP bar
    this.hpBar = scene.add.rectangle(0, -28, 36, 4, 0x4caf50).setOrigin(0.5);
    this.add(this.hpBar);

    scene.add.existing(this);
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 36 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    if (this.hp <= 0) {
      this.destroy();
      return true; // dead
    }
    return false;
  }
}
```

- [ ] **Step 2: Create Ship.js (base class)**

```js
// src/entities/Ship.js
import { DEFAULT_SHIP_ROUTE } from '../config/zones.js';

export class Ship extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.waypoints = [...DEFAULT_SHIP_ROUTE];
    this.currentWaypoint = 0;
    this.alive = true;

    // Visual: circle + emoji
    this.base = scene.add.circle(0, 0, 16, 0x2196f3, 0.5).setStrokeStyle(2, 0x2196f3);
    this.label = scene.add.text(0, 0, stats.icon, { fontSize: '20px' }).setOrigin(0.5);
    this.add([this.base, this.label]);

    // HP bar
    this.hpBar = scene.add.rectangle(0, -22, 30, 3, 0x4caf50).setOrigin(0.5);
    this.add(this.hpBar);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCircle(16, -16, -16);
  }

  update() {
    if (!this.alive || this.currentWaypoint >= this.waypoints.length) return;

    const [tx, ty] = this.waypoints[this.currentWaypoint];
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      this.currentWaypoint++;
      if (this.currentWaypoint >= this.waypoints.length) {
        this.onReachedEnd();
        return;
      }
    } else {
      const vx = (dx / dist) * this.stats.speed;
      const vy = (dy / dist) * this.stats.speed;
      this.body.setVelocity(vx, vy);
    }
  }

  onReachedEnd() {
    // Override in subclasses
    this.alive = false;
    this.body.setVelocity(0, 0);
    this.destroy();
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 30 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    if (this.hp <= 0) {
      this.alive = false;
      this.body.setVelocity(0, 0);
      // Explosion effect
      this.scene.add.text(this.x, this.y, '💥', { fontSize: '32px' }).setOrigin(0.5)
        .setAlpha(1).setDepth(10);
      this.scene.time.delayedCall(500, () => this.destroy());
      return true; // dead
    }
    return false;
  }
}
```

- [ ] **Step 3: Create Tanker.js**

```js
// src/entities/Tanker.js
import { Ship } from './Ship.js';
import { ECONOMY } from '../config/constants.js';

export class Tanker extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
    this.label.setText(stats.icon);
  }

  onReachedEnd() {
    // Score! Tanker made it through
    this.scene.onTankerScored(this);
    this.alive = false;
    this.body.setVelocity(0, 0);

    // Success effect
    const text = this.scene.add.text(this.x, this.y, `+${ECONOMY.TANKER_BONUS} 🛢️`, {
      fontSize: '20px', color: '#4CAF50', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
    this.scene.tweens.add({
      targets: text, y: text.y - 40, alpha: 0, duration: 1000,
      onComplete: () => text.destroy(),
    });

    this.destroy();
  }
}
```

- [ ] **Step 4: Create Destroyer.js**

```js
// src/entities/Destroyer.js
import { Ship } from './Ship.js';
import { PROJECTILES } from '../config/units.js';

export class Destroyer extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
    this.label.setText(stats.icon);
    this.lastFired = 0;
    this.base.fillColor = 0x1565c0;
    this.base.setStrokeStyle(2, 0x1565c0);
  }

  update() {
    super.update();
    if (!this.alive) return;

    // Find nearest IRGC projectile or speedboat and shoot at it
    const now = this.scene.time.now;
    if (now - this.lastFired < this.stats.fireRate) return;

    const target = this.findNearestEnemy();
    if (target) {
      this.lastFired = now;
      this.scene.fireProjectile(this.x, this.y, target, PROJECTILES.DESTROYER_SHELL, 'coalition');
    }
  }

  findNearestEnemy() {
    // Look for IRGC launchers within range
    const launchers = this.scene.irgcTowers?.getChildren() || [];
    let nearest = null;
    let nearestDist = this.stats.range;

    for (const launcher of launchers) {
      if (!launcher.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, launcher.x, launcher.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = launcher;
      }
    }
    return nearest;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/entities/
git commit -m "feat: add entities — OilRig, Ship, Tanker, Destroyer"
```

---

## Task 6: Entities — MissileLauncher & Projectile

**Files:**
- Create: `src/entities/MissileLauncher.js`
- Create: `src/entities/Projectile.js`

- [ ] **Step 1: Create MissileLauncher.js**

```js
// src/entities/MissileLauncher.js
import { PROJECTILES } from '../config/units.js';

export class MissileLauncher extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.lastFired = 0;

    // Visual: red circle + rocket emoji
    this.base = scene.add.circle(0, 0, 18, 0xf44336, 0.6).setStrokeStyle(2, 0xf44336);
    this.label = scene.add.text(0, 0, stats.icon, { fontSize: '20px' }).setOrigin(0.5);
    this.add([this.base, this.label]);

    // Range indicator (faint circle)
    this.rangeCircle = scene.add.circle(0, 0, stats.range, 0xf44336, 0.04)
      .setStrokeStyle(1, 0xf44336, 0.15);
    this.add(this.rangeCircle);

    // HP bar
    this.hpBar = scene.add.rectangle(0, -26, 32, 3, 0x4caf50).setOrigin(0.5);
    this.add(this.hpBar);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.body.setCircle(18, -18, -18);
  }

  update() {
    const now = this.scene.time.now;
    if (now - this.lastFired < this.stats.fireRate) return;

    const target = this.findNearestShip();
    if (target) {
      this.lastFired = now;
      this.scene.fireProjectile(this.x, this.y, target, PROJECTILES.MISSILE, 'irgc');
    }
  }

  findNearestShip() {
    const ships = this.scene.coalitionShips?.getChildren() || [];
    let nearest = null;
    let nearestDist = this.stats.range;

    for (const ship of ships) {
      if (!ship.active || !ship.alive) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, ship.x, ship.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = ship;
      }
    }
    return nearest;
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 32 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    if (this.hp <= 0) {
      this.scene.add.text(this.x, this.y, '💥', { fontSize: '28px' }).setOrigin(0.5).setDepth(10);
      this.scene.time.delayedCall(400, () => this.destroy());
      return true;
    }
    return false;
  }
}
```

- [ ] **Step 2: Create Projectile.js**

```js
// src/entities/Projectile.js
export class Projectile extends Phaser.GameObjects.Arc {
  constructor(scene, x, y, target, config, side) {
    super(scene, x, y, config.radius, 0, 360, false, config.color);
    this.scene = scene;
    this.target = target;
    this.config = config;
    this.side = side;
    this.damage = config.damage;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(5);

    // Add a small trail effect
    this.trail = scene.add.circle(x, y, config.radius * 0.6, config.color, 0.4).setDepth(4);
  }

  update() {
    if (!this.target || !this.target.active) {
      this.destroy();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 15) {
      // Hit!
      this.target.takeDamage(this.damage);
      this.destroy();
      return;
    }

    const vx = (dx / dist) * this.config.speed;
    const vy = (dy / dist) * this.config.speed;
    this.body.setVelocity(vx, vy);

    // Update trail position (lagging behind)
    if (this.trail && this.trail.active) {
      this.trail.x = this.x - vx * 0.05;
      this.trail.y = this.y - vy * 0.05;
    }
  }

  destroy() {
    if (this.trail && this.trail.active) this.trail.destroy();
    super.destroy();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/entities/MissileLauncher.js src/entities/Projectile.js
git commit -m "feat: add MissileLauncher and Projectile entities"
```

---

## Task 7: AI Controller

**Files:**
- Create: `src/systems/AIController.js`

- [ ] **Step 1: Create AIController.js**

```js
// src/systems/AIController.js
import { IRGC_UNITS } from '../config/units.js';
import { IRGC_BUILD_SPOTS } from '../config/zones.js';
import { TIMING, ESCALATION } from '../config/constants.js';

export class AIController {
  constructor(scene, economy, zoneManager) {
    this.scene = scene;
    this.economy = economy;
    this.zoneManager = zoneManager;
    this.usedSpots = new Set();
    this.startTime = Date.now();

    // AI decision loop
    this.scene.time.addEvent({
      delay: TIMING.AI_TICK_MS,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });

    // Place initial launcher after 5 seconds
    this.scene.time.delayedCall(5000, () => this.placeInitialDefenses());
  }

  getElapsedMinutes() {
    return (Date.now() - this.startTime) / 60000;
  }

  getEscalationMultiplier() {
    const minutes = this.getElapsedMinutes();
    let mult = 1.0;
    for (const t of ESCALATION.THRESHOLDS) {
      if (minutes >= t.time) mult = t.multiplier;
    }
    return mult;
  }

  placeInitialDefenses() {
    // Place one oil rig and one launcher to start
    this.tryBuildOilRig();
    this.tryBuildLauncher();
  }

  tick() {
    const mult = this.getEscalationMultiplier();

    // AI earns bonus oil based on escalation (simulates increasing aggression)
    this.economy.earn('irgc', Math.floor(5 * mult));

    // Decision: build oil rig if we have few, otherwise build launchers
    const rigCount = this.economy.irgcRigs.length;
    const launcherCount = this.usedSpots.size - rigCount;

    if (rigCount < 1 + Math.floor(this.getElapsedMinutes() / 3)) {
      this.tryBuildOilRig();
    } else if (this.economy.canAfford('irgc', IRGC_UNITS.MISSILE_LAUNCHER.cost)) {
      this.tryBuildLauncher();
    }
  }

  tryBuildOilRig() {
    const stats = IRGC_UNITS.OIL_RIG;
    if (!this.economy.canAfford('irgc', stats.cost)) return false;

    // Place in IRGC oil zone — pick a random position
    const zone = this.zoneManager.zoneGraphics.IRGC_OIL;
    if (!zone) return false;

    const bounds = zone.geom.getBounds();
    for (let attempt = 0; attempt < 10; attempt++) {
      const x = Phaser.Math.Between(bounds.x + 30, bounds.right - 30);
      const y = Phaser.Math.Between(bounds.y + 30, bounds.bottom - 30);
      if (this.zoneManager.isInZone('IRGC_OIL', x, y)) {
        this.economy.spend('irgc', stats.cost);
        this.scene.placeIRGCOilRig(x, y, stats);
        return true;
      }
    }
    return false;
  }

  tryBuildLauncher() {
    const stats = IRGC_UNITS.MISSILE_LAUNCHER;
    if (!this.economy.canAfford('irgc', stats.cost)) return false;

    // Find an unused build spot
    const available = IRGC_BUILD_SPOTS.filter((_, i) => !this.usedSpots.has(i));
    if (available.length === 0) return false;

    const spotIndex = IRGC_BUILD_SPOTS.indexOf(
      available[Phaser.Math.Between(0, available.length - 1)]
    );
    const spot = IRGC_BUILD_SPOTS[spotIndex];

    this.economy.spend('irgc', stats.cost);
    this.usedSpots.add(spotIndex);
    this.scene.placeIRGCLauncher(spot.x, spot.y, stats);
    return true;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/AIController.js
git commit -m "feat: add AIController — IRGC builds rigs and launchers over time"
```

---

## Task 8: Combat Manager

**Files:**
- Create: `src/systems/CombatManager.js`

- [ ] **Step 1: Create CombatManager.js**

```js
// src/systems/CombatManager.js
export class CombatManager {
  constructor(scene) {
    this.scene = scene;
  }

  update() {
    // Update all IRGC towers (fire at ships)
    const towers = this.scene.irgcTowers?.getChildren() || [];
    for (const tower of towers) {
      if (tower.active && tower.update) tower.update();
    }

    // Update all projectiles (move toward targets)
    const projectiles = this.scene.projectiles?.getChildren() || [];
    for (const proj of projectiles) {
      if (proj.active && proj.update) proj.update();
    }

    // Update all coalition ships (move along waypoints, destroyers fire)
    const ships = this.scene.coalitionShips?.getChildren() || [];
    for (const ship of ships) {
      if (ship.active && ship.update) ship.update();
    }

    // Clean up dead entities
    this.cleanup();
  }

  cleanup() {
    // Remove destroyed ships from economy tracking
    const ships = this.scene.coalitionShips?.getChildren() || [];
    for (const ship of ships) {
      if (!ship.active || (ship.hp !== undefined && ship.hp <= 0)) {
        ship.destroy();
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/systems/CombatManager.js
git commit -m "feat: add CombatManager — update loop for towers, projectiles, ships"
```

---

## Task 9: HUD & Deployment Bar

**Files:**
- Create: `src/ui/HUD.js`
- Create: `src/ui/DeploymentBar.js`

- [ ] **Step 1: Create HUD.js**

```js
// src/ui/HUD.js
export class HUD {
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.startTime = Date.now();

    const style = { fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#ffffff' };
    const bgHeight = 44;

    // Top bar background
    this.bg = scene.add.rectangle(960, 22, 1920, bgHeight, 0x000000, 0.7)
      .setDepth(100).setScrollFactor(0);

    this.oilText = scene.add.text(200, 12, '', { ...style, color: '#FFD54F' })
      .setDepth(101).setScrollFactor(0);
    this.scoreText = scene.add.text(600, 12, '', { ...style, color: '#4CAF50' })
      .setDepth(101).setScrollFactor(0);
    this.timerText = scene.add.text(960, 12, '', { ...style, color: '#90CAF9' })
      .setDepth(101).setScrollFactor(0);
    this.threatText = scene.add.text(1300, 12, '', { ...style, color: '#ef5350' })
      .setDepth(101).setScrollFactor(0);
  }

  update(score) {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = String(elapsed % 60).padStart(2, '0');
    const oil = Math.floor(this.economy.coalitionOil);
    const rigs = this.economy.coalitionRigs.length;

    this.oilText.setText(`🛢️ OIL: ${oil}  (${rigs} rigs)`);
    this.scoreText.setText(`🚢 THROUGH: ${score}`);
    this.timerText.setText(`⏱️ ${minutes}:${seconds}`);

    const threat = elapsed < 120 ? 'LOW' : elapsed < 300 ? 'MEDIUM' : elapsed < 600 ? 'HIGH' : 'EXTREME';
    const threatColor = { LOW: '#4CAF50', MEDIUM: '#FFD54F', HIGH: '#ef5350', EXTREME: '#d32f2f' }[threat];
    this.threatText.setText(`⚠️ ${threat}`).setColor(threatColor);
  }

  getTimeString() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = String(elapsed % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
```

- [ ] **Step 2: Create DeploymentBar.js**

```js
// src/ui/DeploymentBar.js
import { COALITION_UNITS } from '../config/units.js';

export class DeploymentBar {
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.selectedUnit = null;
    this.buttons = [];

    const barY = 1539 - 35;
    const barHeight = 70;

    // Bottom bar background
    this.bg = scene.add.rectangle(960, barY, 1920, barHeight, 0x000000, 0.85)
      .setDepth(100).setScrollFactor(0);

    const unitList = Object.values(COALITION_UNITS);
    const startX = 960 - (unitList.length * 130) / 2 + 65;

    unitList.forEach((unit, i) => {
      const x = startX + i * 130;
      const y = barY;

      const bg = scene.add.rectangle(x, y, 120, 56, 0x333333, 0.8)
        .setStrokeStyle(2, 0x555555).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });

      const icon = scene.add.text(x - 40, y - 12, unit.icon, { fontSize: '22px' })
        .setDepth(102).setScrollFactor(0);
      const name = scene.add.text(x - 10, y - 14, unit.name, { fontSize: '11px', color: '#ccc', fontFamily: 'Arial' })
        .setDepth(102).setScrollFactor(0);
      const cost = scene.add.text(x - 10, y + 4, `${unit.cost} oil`, { fontSize: '12px', color: '#FFD54F', fontFamily: 'Arial' })
        .setDepth(102).setScrollFactor(0);

      bg.on('pointerdown', () => this.selectUnit(unit, bg));

      this.buttons.push({ bg, icon, name, cost, unit });
    });
  }

  selectUnit(unit, bg) {
    // Deselect previous
    this.buttons.forEach(b => b.bg.setStrokeStyle(2, 0x555555));

    if (this.selectedUnit === unit) {
      this.selectedUnit = null;
      return;
    }

    this.selectedUnit = unit;
    bg.setStrokeStyle(2, 0x42a5f5);
  }

  getSelectedUnit() {
    return this.selectedUnit;
  }

  clearSelection() {
    this.selectedUnit = null;
    this.buttons.forEach(b => b.bg.setStrokeStyle(2, 0x555555));
  }

  update() {
    // Grey out units player can't afford
    this.buttons.forEach(({ bg, unit }) => {
      const canAfford = this.economy.canAfford('coalition', unit.cost);
      bg.setAlpha(canAfford ? 1 : 0.4);
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/
git commit -m "feat: add HUD and DeploymentBar UI components"
```

---

## Task 10: Wire Everything Together in GameScene

**Files:**
- Modify: `src/scenes/GameScene.js` (full rewrite)

This is the main integration task. GameScene becomes the orchestrator that creates all managers, handles input, and runs the game loop.

- [ ] **Step 1: Full GameScene implementation**

```js
// src/scenes/GameScene.js
import { ZoneManager } from '../systems/ZoneManager.js';
import { EconomyManager } from '../systems/EconomyManager.js';
import { AIController } from '../systems/AIController.js';
import { CombatManager } from '../systems/CombatManager.js';
import { HUD } from '../ui/HUD.js';
import { DeploymentBar } from '../ui/DeploymentBar.js';
import { OilRig } from '../entities/OilRig.js';
import { Tanker } from '../entities/Tanker.js';
import { Destroyer } from '../entities/Destroyer.js';
import { MissileLauncher } from '../entities/MissileLauncher.js';
import { Projectile } from '../entities/Projectile.js';
import { COALITION_UNITS } from '../config/units.js';
import { ECONOMY } from '../config/constants.js';
import { DEFAULT_SHIP_ROUTE } from '../config/zones.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    // Background
    this.add.image(960, 770, 'map').setDisplaySize(1920, 1539);

    // Phaser groups for entity management
    this.coalitionShips = this.add.group();
    this.irgcTowers = this.add.group();
    this.coalitionRigs = this.add.group();
    this.irgcRigs = this.add.group();
    this.projectiles = this.add.group();

    // Systems
    this.zoneManager = new ZoneManager(this);
    this.economy = new EconomyManager(this);
    this.ai = new AIController(this, this.economy, this.zoneManager);
    this.combat = new CombatManager(this);

    // UI
    this.hud = new HUD(this, this.economy);
    this.deployBar = new DeploymentBar(this, this.economy);

    // Score
    this.score = 0;

    // Click handler — place units on the map
    this.input.on('pointerdown', (pointer) => this.handleMapClick(pointer));

    // Show route preview
    this.drawRoutePreview();
  }

  update() {
    this.combat.update();
    this.hud.update(this.score);
    this.deployBar.update();
    this.checkGameOver();
  }

  handleMapClick(pointer) {
    const { x, y } = pointer;

    // Ignore clicks on HUD/deployment bar
    if (y < 50 || y > 1490) return;

    const unit = this.deployBar.getSelectedUnit();
    if (!unit) return;

    // Check if placement is in correct zone
    const validZone = unit.zone;
    if (!this.zoneManager.isInZone(validZone, x, y)) {
      this.showMessage(x, y, '❌ Wrong zone!', '#ef5350');
      return;
    }

    // Check if player can afford it
    if (!this.economy.canAfford('coalition', unit.cost)) {
      this.showMessage(x, y, '❌ Not enough oil!', '#ef5350');
      return;
    }

    // Spend oil and place unit
    this.economy.spend('coalition', unit.cost);

    switch (unit.key) {
      case 'OIL_RIG':
        this.placeCoalitionOilRig(x, y, unit);
        break;
      case 'TANKER':
        this.deployShip(x, y, unit, Tanker);
        break;
      case 'DESTROYER':
        this.deployShip(x, y, unit, Destroyer);
        break;
    }

    this.deployBar.clearSelection();
  }

  placeCoalitionOilRig(x, y, stats) {
    const rig = new OilRig(this, x, y, 'coalition', stats);
    this.coalitionRigs.add(rig);
    this.economy.registerRig('coalition', rig);
  }

  deployShip(x, y, stats, ShipClass) {
    // Ships start from the deploy zone and follow the route
    const startPos = DEFAULT_SHIP_ROUTE[0];
    const ship = new ShipClass(this, startPos[0], startPos[1], stats);
    this.coalitionShips.add(ship);
  }

  placeIRGCOilRig(x, y, stats) {
    const rig = new OilRig(this, x, y, 'irgc', stats);
    this.irgcRigs.add(rig);
    this.economy.registerRig('irgc', rig);
  }

  placeIRGCLauncher(x, y, stats) {
    const launcher = new MissileLauncher(this, x, y, stats);
    this.irgcTowers.add(launcher);
  }

  fireProjectile(fromX, fromY, target, config, side) {
    const proj = new Projectile(this, fromX, fromY, target, config, side);
    this.projectiles.add(proj);
  }

  onTankerScored(tanker) {
    this.score += tanker.stats.scoreValue;
    this.economy.earn('coalition', tanker.stats.oilBonus);
  }

  drawRoutePreview() {
    const gfx = this.add.graphics();
    gfx.lineStyle(2, 0xffffff, 0.15);
    gfx.beginPath();
    DEFAULT_SHIP_ROUTE.forEach(([x, y], i) => {
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    });
    gfx.strokePath();

    // Arrow markers
    DEFAULT_SHIP_ROUTE.forEach(([x, y]) => {
      gfx.fillStyle(0xffffff, 0.2);
      gfx.fillCircle(x, y, 4);
    });
  }

  showMessage(x, y, text, color) {
    const msg = this.add.text(x, y - 20, text, {
      fontSize: '16px', color, fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: msg, y: msg.y - 30, alpha: 0, duration: 800,
      onComplete: () => msg.destroy(),
    });
  }

  checkGameOver() {
    const oil = this.economy.coalitionOil;
    const rigs = this.economy.coalitionRigs.length;
    const ships = this.coalitionShips.getLength();
    const cheapest = Math.min(...Object.values(COALITION_UNITS).map(u => u.cost));

    // Game over: no rigs, no ships, can't afford anything
    if (rigs === 0 && ships === 0 && oil < cheapest) {
      this.scene.start('GameOver', {
        score: this.score,
        time: this.hud.getTimeString(),
      });
    }
  }
}
```

- [ ] **Step 2: Run and verify end-to-end**

Run `npm run dev`. **Verify:**
1. Satellite map loads with zone overlays
2. HUD shows at top (oil counting up from 1500)
3. Deployment bar at bottom with 3 units
4. Click Oil Rig button, then click in blue coalition zone → rig appears, oil income increases
5. Click Tanker button, then click in deploy zone → tanker sails along route through the strait
6. After ~5-10 seconds, IRGC places a launcher on an island → fires missiles at ships
7. Ships take damage, show HP bars, explode on death
8. Tankers that reach the exit zone → score increases + oil bonus
9. When player runs out of everything → game over screen appears with score

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: wire up GameScene — full game loop with all systems and entities"
```

---

## Task 11: Polish & Playtest Fixes

**Files:**
- Potentially any file — this task is for fixing issues found during playtesting

- [ ] **Step 1: Playtest and note issues**

Run the game, play for 2-3 minutes. Common issues to look for:
- Zone polygons don't align well with the satellite geography → adjust coordinates in `config/zones.js`
- Ships move off-screen or clip through land → adjust `DEFAULT_SHIP_ROUTE` waypoints
- Missiles miss or behave strangely → check Projectile.update() distance threshold
- IRGC builds too fast or too slow → tune `TIMING.AI_TICK_MS` and `ESCALATION` in constants
- Oil generation too fast/slow → tune `ECONOMY.OIL_RIG_RATE` and starting values
- Game over triggers too early → check `checkGameOver()` conditions

- [ ] **Step 2: Fix issues found in playtesting**

Adjust config values and fix any bugs. All tuning changes should go in `src/config/` files only.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: playtest fixes — tuning and bug fixes"
```

---

## Implementation Notes

**Modularity guarantee:** Every game concept is isolated:
- **Want to add a new ship type?** Create a new file in `entities/`, add stats to `config/units.js`, add a case in `GameScene.handleMapClick()`.
- **Want to change zone boundaries?** Edit `config/zones.js` only.
- **Want to adjust difficulty?** Edit `config/constants.js` only.
- **Want to add a new IRGC building?** Create entity in `entities/`, add stats to `config/units.js`, add placement logic in `AIController.js`.
- **Want to change the ship route?** Edit `DEFAULT_SHIP_ROUTE` in `config/zones.js`.

**No file depends on more than 2-3 other files.** The dependency graph is a clean tree with GameScene as the root.
