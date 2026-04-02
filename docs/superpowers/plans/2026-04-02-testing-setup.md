# Testing Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vitest unit tests and Playwright E2E smoke test with minimal maintenance burden.

**Architecture:** Extract pure calculation functions from entities/systems into `src/utils/calculations.js`. Unit-test those functions directly (zero mocking). Add thin scene-mock tests for EconomyManager and BalanceMeter. Add one Playwright smoke test that boots the game and checks for crashes.

**Tech Stack:** Vitest, @playwright/test, Vite (existing)

---

### Task 1: Install dependencies and configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 1: Install vitest**

```bash
cd /Users/sagipolaczek/Documents/projects/strait_of_hormuz_tower_defense && npm install --save-dev vitest
```

- [ ] **Step 2: Create vitest.config.js**

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

Add to the `"scripts"` object in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs (no tests yet — should report 0)**

```bash
npm test
```

Expected: exits cleanly with "no test files found" or similar.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js
git commit -m "chore: add vitest and test configuration"
```

---

### Task 2: Extract pure calculation functions

**Files:**
- Create: `src/utils/calculations.js`

Extract all gameplay math into pure functions. These have ZERO imports — they take primitives and return primitives.

- [ ] **Step 1: Create `src/utils/calculations.js`**

```js
/**
 * Pure calculation functions for game mechanics.
 * No Phaser dependency — takes primitives, returns primitives.
 */

/**
 * Calculate max HP for a ship with hull/armor upgrades.
 * Ship uses HULL (0.4 per level), Airfield uses ARMOR (0.35 per level).
 */
export function getMaxHP(baseHP, hullLevel = 0, armorLevel = 0) {
  return Math.floor(baseHP * (1 + 0.4 * hullLevel + 0.35 * armorLevel));
}

/**
 * Calculate effective speed with engine upgrades.
 * +25% per engine level.
 */
export function getEffectiveSpeed(baseSpeed, engineLevel = 0) {
  return baseSpeed * (1 + 0.25 * engineLevel);
}

/**
 * Calculate effective damage with damage upgrades.
 * +30% per damage level.
 */
export function getEffectiveDamage(baseDamage, damageLevel = 0) {
  return Math.floor(baseDamage * (1 + 0.3 * damageLevel));
}

/**
 * Calculate effective fire rate with fire rate upgrades.
 * -20% cooldown per level (lower = faster).
 */
export function getEffectiveFireRate(baseRate, fireRateLevel = 0) {
  return Math.floor(baseRate * (1 - 0.2 * fireRateLevel));
}

/**
 * Calculate effective range with range upgrades.
 * +20% per range level.
 */
export function getEffectiveRange(baseRange, rangeLevel = 0) {
  return baseRange * (1 + 0.2 * rangeLevel);
}

/**
 * Calculate effective sonar range with sonar upgrades.
 * +25% per sonar level.
 */
export function getEffectiveSonarRange(baseRange, sonarLevel = 0) {
  return baseRange * (1 + 0.25 * sonarLevel);
}

/**
 * Calculate max oil storage with storage upgrades.
 * +50% per storage level.
 */
export function getMaxStorage(baseStorage, storageLevel = 0) {
  return baseStorage * (1 + 0.5 * storageLevel);
}

/**
 * Look up the current drift rate from a time-based rate table.
 * Returns the rate for the latest threshold <= current minutes.
 * @param {number} minutes - elapsed minutes
 * @param {Array<{time: number, rate: number}>} driftRates - sorted thresholds
 * @returns {number} drift rate per tick
 */
export function getDriftRate(minutes, driftRates) {
  let rate = driftRates[0].rate;
  for (const t of driftRates) {
    if (minutes >= t.time) rate = t.rate;
  }
  return rate;
}

/**
 * Look up the current escalation multiplier from a time-based threshold table.
 * @param {number} minutes - elapsed minutes
 * @param {Array<{time: number, multiplier: number}>} thresholds - sorted thresholds
 * @returns {number} escalation multiplier
 */
export function getEscalationMultiplier(minutes, thresholds) {
  let mult = 1.0;
  for (const t of thresholds) {
    if (minutes >= t.time) mult = t.multiplier;
  }
  return mult;
}

/**
 * Apply a multiplicative change to an oil multiplier, clamped to [floor, ceiling].
 * @param {number} current - current multiplier
 * @param {number} change - multiplicative factor (e.g. 1.05 for +5%)
 * @param {number} floor - minimum multiplier
 * @param {number} ceiling - maximum multiplier
 * @returns {number} clamped new multiplier
 */
export function clampMultiplier(current, change, floor, ceiling) {
  return Math.max(floor, Math.min(ceiling, current * change));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/calculations.js
git commit -m "feat: extract pure calculation functions from entities"
```

---

### Task 3: Wire entities to use extracted calculations

**Files:**
- Modify: `src/entities/Ship.js:54-61`
- Modify: `src/entities/Destroyer.js:28-33`
- Modify: `src/entities/AirDefense.js:38-54`
- Modify: `src/entities/CoalitionSubmarine.js:72-81`
- Modify: `src/entities/Airfield.js:111-113`
- Modify: `src/entities/OilRig.js:77-82`
- Modify: `src/systems/BalanceMeter.js:37-49`
- Modify: `src/systems/AIController.js:227-234`

Each entity method delegates to the pure function. Behavior is identical.

- [ ] **Step 1: Update Ship.js**

Add import at top of `src/entities/Ship.js`:
```js
import { getMaxHP as calcMaxHP, getEffectiveSpeed as calcSpeed } from '../utils/calculations.js';
```

Replace `getMaxHP()` (line 54-58):
```js
  getMaxHP() {
    return calcMaxHP(this.stats.hp, this.upgrades.HULL || 0, this.upgrades.ARMOR || 0);
  }
```

Replace `getEffectiveSpeed()` (line 60-62):
```js
  getEffectiveSpeed() {
    return calcSpeed(this.stats.speed, this.upgrades.ENGINE || 0);
  }
```

- [ ] **Step 2: Update Destroyer.js**

Add import at top of `src/entities/Destroyer.js`:
```js
import { getEffectiveDamage as calcDamage, getEffectiveFireRate as calcFireRate } from '../utils/calculations.js';
```

Replace `getEffectiveDamage()` (line 28-30):
```js
  getEffectiveDamage() {
    return calcDamage(this.stats.damage, this.upgrades.DAMAGE || 0);
  }
```

Replace `getEffectiveFireRate()` (line 32-34):
```js
  getEffectiveFireRate() {
    return calcFireRate(this.stats.fireRate, this.upgrades.FIRE_RATE || 0);
  }
```

- [ ] **Step 3: Update AirDefense.js**

Add import at top of `src/entities/AirDefense.js`:
```js
import { getEffectiveRange as calcRange, getEffectiveFireRate as calcFireRate } from '../utils/calculations.js';
```

Replace `getEffectiveRange()` (line 49-51):
```js
  getEffectiveRange() {
    return calcRange(this.stats.range, this.upgrades.RANGE || 0);
  }
```

Replace `getEffectiveFireRate()` (line 53-55):
```js
  getEffectiveFireRate() {
    return calcFireRate(this.stats.fireRate, this.upgrades.FIRE_RATE || 0);
  }
```

- [ ] **Step 4: Update CoalitionSubmarine.js**

Add import at top of `src/entities/CoalitionSubmarine.js`:
```js
import { getEffectiveSonarRange as calcSonar, getEffectiveDamage as calcDamage } from '../utils/calculations.js';
```

Replace `getEffectiveSonarRange()` (line 72-74):
```js
  getEffectiveSonarRange() {
    return calcSonar(this.sonarRange, this.upgrades.SONAR || 0);
  }
```

Replace `getEffectiveDamage()` (line 76-78):
```js
  getEffectiveDamage() {
    return calcDamage(this.stats.damage, this.upgrades.TORPEDO || 0);
  }
```

- [ ] **Step 5: Update Airfield.js**

Add import at top of `src/entities/Airfield.js`:
```js
import { getMaxHP as calcMaxHP } from '../utils/calculations.js';
```

Replace `getMaxHP()` (line 111-113):
```js
  getMaxHP() {
    return calcMaxHP(this.stats.hp, 0, this.upgrades.ARMOR || 0);
  }
```

- [ ] **Step 6: Update OilRig.js**

Add import at top of `src/entities/OilRig.js`:
```js
import { getMaxStorage as calcStorage } from '../utils/calculations.js';
```

Replace `getMaxStorage()` (line 84-86):
```js
  getMaxStorage() {
    return calcStorage(this.maxStorage, this.upgrades?.STORAGE || 0);
  }
```

- [ ] **Step 7: Update BalanceMeter.js**

Add import at top of `src/systems/BalanceMeter.js`:
```js
import { getDriftRate as calcDriftRate } from '../utils/calculations.js';
```

Replace `getDriftRate()` (line 37-49):
```js
  getDriftRate() {
    const minutes = this.getElapsedMinutes();
    const minuteFloor = Math.floor(minutes);
    if (minuteFloor !== this._cachedMinute) {
      this._cachedMinute = minuteFloor;
      this._cachedRate = calcDriftRate(minutes, BALANCE.DRIFT_RATES);
    }
    return this._cachedRate;
  }
```

- [ ] **Step 8: Update AIController.js**

Add import at top of `src/systems/AIController.js`:
```js
import { getEscalationMultiplier as calcEscalation } from '../utils/calculations.js';
```

Replace `getEscalationMultiplier()` (line 227-234):
```js
  getEscalationMultiplier() {
    const minutes = this.getElapsedMinutes();
    return calcEscalation(minutes, ESCALATION.THRESHOLDS);
  }
```

- [ ] **Step 9: Verify the game still works**

```bash
npm run build
```

Expected: build succeeds with no errors. (Also manually run `npm run dev` and click through the game briefly to confirm nothing broke.)

- [ ] **Step 10: Commit**

```bash
git add src/entities/Ship.js src/entities/Destroyer.js src/entities/AirDefense.js src/entities/CoalitionSubmarine.js src/entities/Airfield.js src/entities/OilRig.js src/systems/BalanceMeter.js src/systems/AIController.js
git commit -m "refactor: wire entities/systems to use pure calculation functions"
```

---

### Task 4: Write unit tests for pure calculations

**Files:**
- Create: `tests/unit/calculations.test.js`

- [ ] **Step 1: Create `tests/unit/calculations.test.js`**

```js
import { describe, it, expect } from 'vitest';
import {
  getMaxHP,
  getEffectiveSpeed,
  getEffectiveDamage,
  getEffectiveFireRate,
  getEffectiveRange,
  getEffectiveSonarRange,
  getMaxStorage,
  getDriftRate,
  getEscalationMultiplier,
  clampMultiplier,
} from '../../src/utils/calculations.js';

describe('getMaxHP', () => {
  it('returns base HP with no upgrades', () => {
    expect(getMaxHP(100)).toBe(100);
  });

  it('applies hull upgrade (+40% per level)', () => {
    expect(getMaxHP(100, 1, 0)).toBe(140);
    expect(getMaxHP(100, 2, 0)).toBe(180);
  });

  it('applies armor upgrade (+35% per level)', () => {
    expect(getMaxHP(100, 0, 1)).toBe(135);
    expect(getMaxHP(100, 0, 2)).toBe(170);
  });

  it('stacks hull and armor', () => {
    expect(getMaxHP(100, 1, 1)).toBe(175);
  });

  it('floors the result', () => {
    expect(getMaxHP(33, 1, 0)).toBe(46); // 33 * 1.4 = 46.2 → 46
  });
});

describe('getEffectiveSpeed', () => {
  it('returns base speed with no upgrades', () => {
    expect(getEffectiveSpeed(60, 0)).toBe(60);
  });

  it('applies engine upgrade (+25% per level)', () => {
    expect(getEffectiveSpeed(60, 1)).toBe(75);
    expect(getEffectiveSpeed(60, 2)).toBe(90);
  });
});

describe('getEffectiveDamage', () => {
  it('returns base damage with no upgrades', () => {
    expect(getEffectiveDamage(40)).toBe(40);
  });

  it('applies damage upgrade (+30% per level)', () => {
    expect(getEffectiveDamage(40, 1)).toBe(52);  // 40 * 1.3 = 52
    expect(getEffectiveDamage(40, 2)).toBe(64);  // 40 * 1.6 = 64
    expect(getEffectiveDamage(40, 3)).toBe(76);  // 40 * 1.9 = 76
  });
});

describe('getEffectiveFireRate', () => {
  it('returns base rate with no upgrades', () => {
    expect(getEffectiveFireRate(1500)).toBe(1500);
  });

  it('reduces cooldown (-20% per level)', () => {
    expect(getEffectiveFireRate(1500, 1)).toBe(1200);
    expect(getEffectiveFireRate(1500, 2)).toBe(900);
  });
});

describe('getEffectiveRange', () => {
  it('returns base range with no upgrades', () => {
    expect(getEffectiveRange(400)).toBe(400);
  });

  it('increases range (+20% per level)', () => {
    expect(getEffectiveRange(400, 1)).toBe(480);
    expect(getEffectiveRange(400, 2)).toBe(560);
  });
});

describe('getEffectiveSonarRange', () => {
  it('returns base range with no upgrades', () => {
    expect(getEffectiveSonarRange(300)).toBe(300);
  });

  it('increases sonar range (+25% per level)', () => {
    expect(getEffectiveSonarRange(300, 1)).toBe(375);
    expect(getEffectiveSonarRange(300, 2)).toBe(450);
  });
});

describe('getMaxStorage', () => {
  it('returns base storage with no upgrades', () => {
    expect(getMaxStorage(60)).toBe(60);
  });

  it('increases storage (+50% per level)', () => {
    expect(getMaxStorage(60, 1)).toBe(90);
    expect(getMaxStorage(60, 2)).toBe(120);
    expect(getMaxStorage(60, 3)).toBe(150);
  });
});

describe('getDriftRate', () => {
  const driftRates = [
    { time: 0, rate: -0.15 },
    { time: 2, rate: -0.20 },
    { time: 5, rate: -0.28 },
    { time: 8, rate: -0.35 },
  ];

  it('returns initial rate at time 0', () => {
    expect(getDriftRate(0, driftRates)).toBe(-0.15);
  });

  it('returns rate for time between thresholds', () => {
    expect(getDriftRate(1.5, driftRates)).toBe(-0.15);
    expect(getDriftRate(3, driftRates)).toBe(-0.20);
    expect(getDriftRate(6, driftRates)).toBe(-0.28);
  });

  it('returns highest rate at late times', () => {
    expect(getDriftRate(10, driftRates)).toBe(-0.35);
    expect(getDriftRate(100, driftRates)).toBe(-0.35);
  });

  it('returns rate exactly at threshold boundary', () => {
    expect(getDriftRate(2, driftRates)).toBe(-0.20);
    expect(getDriftRate(5, driftRates)).toBe(-0.28);
    expect(getDriftRate(8, driftRates)).toBe(-0.35);
  });
});

describe('getEscalationMultiplier', () => {
  const thresholds = [
    { time: 0, multiplier: 1.0 },
    { time: 2, multiplier: 1.5 },
    { time: 5, multiplier: 2.5 },
    { time: 10, multiplier: 3.0 },
  ];

  it('returns 1.0 at start', () => {
    expect(getEscalationMultiplier(0, thresholds)).toBe(1.0);
  });

  it('returns correct multiplier between thresholds', () => {
    expect(getEscalationMultiplier(1, thresholds)).toBe(1.0);
    expect(getEscalationMultiplier(3, thresholds)).toBe(1.5);
    expect(getEscalationMultiplier(7, thresholds)).toBe(2.5);
  });

  it('returns max multiplier at late times', () => {
    expect(getEscalationMultiplier(15, thresholds)).toBe(3.0);
  });
});

describe('clampMultiplier', () => {
  it('applies change within bounds', () => {
    expect(clampMultiplier(1.0, 1.05, 0.5, 2.0)).toBeCloseTo(1.05);
  });

  it('clamps to floor', () => {
    expect(clampMultiplier(0.6, 0.7, 0.5, 2.0)).toBe(0.5);
  });

  it('clamps to ceiling', () => {
    expect(clampMultiplier(1.8, 1.2, 0.5, 2.0)).toBe(2.0);
  });

  it('handles exact boundary values', () => {
    expect(clampMultiplier(1.0, 0.5, 0.5, 2.0)).toBe(0.5);
    expect(clampMultiplier(1.0, 2.0, 0.5, 2.0)).toBe(2.0);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/calculations.test.js
git commit -m "test: add unit tests for pure calculation functions"
```

---

### Task 5: Write unit tests for EconomyManager

**Files:**
- Create: `tests/helpers/scene-mock.js`
- Create: `tests/unit/economy.test.js`

- [ ] **Step 1: Create `tests/helpers/scene-mock.js`**

```js
/**
 * Minimal Phaser scene mock for testing systems.
 * Only implements methods that EconomyManager and BalanceMeter actually call.
 */
export function createSceneMock(overrides = {}) {
  const timers = [];

  const mock = {
    time: {
      now: 0,
      addEvent: (config) => {
        const timer = { remove: () => {}, config };
        timers.push(timer);
        return timer;
      },
      delayedCall: (delay, cb) => {
        const timer = { remove: () => {}, delay, cb };
        timers.push(timer);
        return timer;
      },
      paused: false,
    },
    trumpShock: { getMultiplier: () => 1.0 },
    _timers: timers,
    ...overrides,
  };

  return mock;
}

/**
 * Trigger all looping timer callbacks once (simulates one tick).
 */
export function tickTimers(sceneMock) {
  for (const timer of sceneMock._timers) {
    if (timer.config?.callback && timer.config?.loop) {
      timer.config.callback.call(timer.config.callbackScope || null);
    }
  }
}
```

- [ ] **Step 2: Create `tests/unit/economy.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createSceneMock, tickTimers } from '../helpers/scene-mock.js';
import { EconomyManager } from '../../src/systems/EconomyManager.js';
import { ECONOMY } from '../../src/config/constants.js';

describe('EconomyManager', () => {
  let scene, economy;

  beforeEach(() => {
    scene = createSceneMock();
    economy = new EconomyManager(scene);
  });

  describe('initial state', () => {
    it('starts with configured oil amounts', () => {
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL);
      expect(economy.irgcOil).toBe(ECONOMY.IRGC_START_OIL);
    });

    it('starts with empty rig arrays', () => {
      expect(economy.coalitionRigs).toEqual([]);
      expect(economy.irgcRigs).toEqual([]);
    });
  });

  describe('canAfford', () => {
    it('returns true when oil is sufficient', () => {
      expect(economy.canAfford('coalition', 500)).toBe(true);
    });

    it('returns false when oil is insufficient', () => {
      expect(economy.canAfford('coalition', 99999)).toBe(false);
    });

    it('returns true at exact oil amount', () => {
      expect(economy.canAfford('coalition', ECONOMY.COALITION_START_OIL)).toBe(true);
    });

    it('works for IRGC side', () => {
      expect(economy.canAfford('irgc', ECONOMY.IRGC_START_OIL)).toBe(true);
      expect(economy.canAfford('irgc', ECONOMY.IRGC_START_OIL + 1)).toBe(false);
    });
  });

  describe('spend', () => {
    it('deducts oil on successful spend', () => {
      economy.spend('coalition', 200);
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL - 200);
    });

    it('returns true on successful spend', () => {
      expect(economy.spend('coalition', 200)).toBe(true);
    });

    it('returns false when insufficient oil', () => {
      expect(economy.spend('coalition', 99999)).toBe(false);
    });

    it('does not deduct when insufficient', () => {
      economy.spend('coalition', 99999);
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL);
    });

    it('works for IRGC side', () => {
      economy.spend('irgc', 100);
      expect(economy.irgcOil).toBe(ECONOMY.IRGC_START_OIL - 100);
    });
  });

  describe('earn', () => {
    it('adds oil to coalition', () => {
      economy.earn('coalition', 500);
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL + 500);
    });

    it('adds oil to IRGC', () => {
      economy.earn('irgc', 300);
      expect(economy.irgcOil).toBe(ECONOMY.IRGC_START_OIL + 300);
    });
  });

  describe('registerRig / unregisterRig', () => {
    it('registers coalition rigs', () => {
      const rig = { id: 'rig1' };
      economy.registerRig('coalition', rig);
      expect(economy.coalitionRigs).toContain(rig);
    });

    it('registers IRGC rigs', () => {
      const rig = { id: 'rig2' };
      economy.registerRig('irgc', rig);
      expect(economy.irgcRigs).toContain(rig);
    });

    it('unregisters rigs', () => {
      const rig = { id: 'rig1' };
      economy.registerRig('coalition', rig);
      economy.unregisterRig('coalition', rig);
      expect(economy.coalitionRigs).not.toContain(rig);
    });

    it('handles unregister of non-existent rig gracefully', () => {
      economy.unregisterRig('coalition', { id: 'fake' });
      expect(economy.coalitionRigs).toEqual([]);
    });
  });

  describe('collectFromRig', () => {
    it('transfers stored oil to coalition total', () => {
      const rig = { storedOil: 50 };
      const collected = economy.collectFromRig(rig);
      expect(collected).toBe(50);
      expect(rig.storedOil).toBe(0);
      expect(economy.coalitionOil).toBe(ECONOMY.COALITION_START_OIL + 50);
    });

    it('returns 0 for empty rig', () => {
      const rig = { storedOil: 0 };
      expect(economy.collectFromRig(rig)).toBe(0);
    });

    it('returns 0 for rig with no storedOil property', () => {
      expect(economy.collectFromRig({})).toBe(0);
    });
  });

  describe('tick', () => {
    it('adds oil to IRGC based on rig count', () => {
      economy.registerRig('irgc', { active: true });
      economy.registerRig('irgc', { active: true });
      const before = economy.irgcOil;
      tickTimers(scene);
      expect(economy.irgcOil).toBe(before + 2 * ECONOMY.OIL_RIG_RATE);
    });

    it('calls addStoredOil on coalition rigs', () => {
      let oilAdded = 0;
      const rig = {
        active: true,
        addStoredOil: (amount) => { oilAdded = amount; },
        upgrades: {},
      };
      economy.registerRig('coalition', rig);
      tickTimers(scene);
      expect(oilAdded).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass (calculations + economy).

- [ ] **Step 4: Commit**

```bash
git add tests/helpers/scene-mock.js tests/unit/economy.test.js
git commit -m "test: add EconomyManager unit tests with scene mock"
```

---

### Task 6: Write unit tests for BalanceMeter

**Files:**
- Create: `tests/unit/balance.test.js`

- [ ] **Step 1: Create `tests/unit/balance.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { createSceneMock, tickTimers } from '../helpers/scene-mock.js';
import { BalanceMeter } from '../../src/systems/BalanceMeter.js';
import { BALANCE } from '../../src/config/constants.js';

describe('BalanceMeter', () => {
  let scene, meter;

  beforeEach(() => {
    scene = createSceneMock();
    meter = new BalanceMeter(scene);
  });

  describe('initial state', () => {
    it('starts at BALANCE.START', () => {
      expect(meter.value).toBe(BALANCE.START);
    });

    it('is not ended', () => {
      expect(meter.ended).toBe(false);
    });
  });

  describe('tick', () => {
    it('drifts value toward negative', () => {
      meter.tick();
      expect(meter.value).toBeLessThan(BALANCE.START);
    });

    it('does not tick when ended', () => {
      meter.ended = true;
      const before = meter.value;
      meter.tick();
      expect(meter.value).toBe(before);
    });

    it('clamps to MIN', () => {
      meter.value = BALANCE.MIN + 0.001;
      meter.tick();
      expect(meter.value).toBeGreaterThanOrEqual(BALANCE.MIN);
    });
  });

  describe('onTankerScored', () => {
    it('pushes value positive', () => {
      meter.value = 0;
      meter.onTankerScored();
      expect(meter.value).toBe(BALANCE.TANKER_BONUS);
    });

    it('clamps to MAX', () => {
      meter.value = BALANCE.MAX - 1;
      meter.onTankerScored();
      expect(meter.value).toBe(BALANCE.MAX);
    });
  });

  describe('getNormalized', () => {
    it('returns 0 at start (value=0)', () => {
      expect(meter.getNormalized()).toBe(0);
    });

    it('returns 1 at MAX', () => {
      meter.value = BALANCE.MAX;
      expect(meter.getNormalized()).toBe(1);
    });

    it('returns -1 at MIN', () => {
      meter.value = BALANCE.MIN;
      expect(meter.getNormalized()).toBe(-1);
    });
  });

  describe('win/lose conditions', () => {
    it('isDefeat at MIN', () => {
      meter.value = BALANCE.MIN;
      expect(meter.isDefeat()).toBe(true);
    });

    it('isVictory at MAX', () => {
      meter.value = BALANCE.MAX;
      expect(meter.isVictory()).toBe(true);
    });

    it('neither at START', () => {
      expect(meter.isDefeat()).toBe(false);
      expect(meter.isVictory()).toBe(false);
    });
  });

  describe('pause/resume', () => {
    it('tracks pause time', () => {
      const pauseMs = meter._totalPauseMs;
      meter.onPause();
      meter.onResume();
      expect(meter._totalPauseMs).toBeGreaterThanOrEqual(pauseMs);
    });
  });
});
```

- [ ] **Step 2: Run all unit tests**

```bash
npm test
```

Expected: all tests pass (calculations + economy + balance).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/balance.test.js
git commit -m "test: add BalanceMeter unit tests"
```

---

### Task 7: Set up Playwright E2E smoke test

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/smoke.test.js`
- Modify: `package.json` (add test:e2e and test:all scripts)
- Delete: `debug-test.mjs` (replaced by the proper smoke test)

- [ ] **Step 1: Install Playwright**

```bash
cd /Users/sagipolaczek/Documents/projects/strait_of_hormuz_tower_defense && npm install --save-dev @playwright/test
```

Then install browsers:

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.js`**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    headless: true,
  },
  webServer: {
    command: 'npm run dev -- --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 10000,
  },
});
```

- [ ] **Step 3: Create `tests/e2e/smoke.test.js`**

```js
import { test, expect } from '@playwright/test';

test('game boots without crashes', async ({ page }) => {
  const errors = [];
  const crashes = [];

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  page.on('console', (msg) => {
    if (msg.text().includes('CRASH')) {
      crashes.push(msg.text());
    }
  });

  await page.goto('http://localhost:4173');

  // Wait for boot sequence + early gameplay (12 seconds)
  await page.waitForTimeout(12000);

  // Canvas should exist
  const canvas = await page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Canvas should have non-zero dimensions
  const box = await canvas.boundingBox();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);

  // No page errors (uncaught exceptions)
  expect(errors).toEqual([]);

  // No CRASH messages in console
  expect(crashes).toEqual([]);
});
```

- [ ] **Step 4: Add scripts to package.json**

Add to the `"scripts"` object:

```json
"test:e2e": "npx playwright test",
"test:all": "vitest run && npx playwright test"
```

- [ ] **Step 5: Run the E2E smoke test**

```bash
npm run test:e2e
```

Expected: test passes — game boots, canvas exists, no crashes.

- [ ] **Step 6: Delete the old debug-test.mjs**

```bash
rm debug-test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add playwright.config.js tests/e2e/smoke.test.js package.json package-lock.json
git rm debug-test.mjs
git commit -m "test: add Playwright E2E smoke test, remove debug-test.mjs"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run all tests together**

```bash
npm run test:all
```

Expected: all unit tests pass, E2E smoke test passes.

- [ ] **Step 2: Verify build still works**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 3: Verify no untracked files left behind**

```bash
git status
```

Expected: clean working tree (except the pre-existing `M src/entities/FastBoat.js` and untracked `animation-preview.html`).
