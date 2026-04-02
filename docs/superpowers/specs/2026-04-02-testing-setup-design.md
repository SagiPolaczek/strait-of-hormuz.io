# Testing Setup — Design Spec

**Date:** 2026-04-02
**Status:** Approved

## Overview

Add a lightweight, low-maintenance testing setup to the project with two layers:
1. **Unit tests** (Vitest) — pure function extraction + thin system tests
2. **E2E smoke test** (Playwright) — boots the game, checks for crashes

### Philosophy

Test math, not wiring. The game's testable value is in its calculations — upgrade stacking, economy math, balance drift, escalation curves, damage formulas. These should be pure functions with zero Phaser dependency. Everything else is covered by a single E2E smoke test.

## File Structure

```
src/
  utils/
    calculations.js     ← NEW: pure functions extracted from entities/systems
    textures.js          ← existing (unchanged)
tests/
  unit/
    calculations.test.js ← tests pure math functions
    economy.test.js      ← tests EconomyManager with thin scene mock
    balance.test.js      ← tests BalanceMeter with thin scene mock
  e2e/
    smoke.test.js        ← Playwright: boot game, check no crashes
  helpers/
    scene-mock.js        ← minimal fake scene object
vitest.config.js
playwright.config.js
```

## Pure Calculation Functions

Extract from entities/systems into `src/utils/calculations.js`. The originals call through to these — no behavior change.

| Function | Source | Logic |
|----------|--------|-------|
| `getMaxHP(baseHP, upgrades)` | Ship, Airfield | `baseHP * (1 + 0.4 * hull + 0.35 * armor)` |
| `getEffectiveSpeed(baseSpeed, upgrades)` | Ship | `baseSpeed * (1 + 0.25 * engine)` |
| `getEffectiveDamage(baseDamage, upgrades)` | Destroyer, CoalitionSubmarine | `floor(baseDamage * (1 + 0.3 * damageLevel))` |
| `getEffectiveFireRate(baseRate, upgrades)` | Destroyer, AirDefense | `floor(baseRate * (1 - 0.2 * fireRateLevel))` |
| `getEffectiveRange(baseRange, upgrades)` | AirDefense | `baseRange * (1 + 0.2 * rangeLevel)` |
| `getEffectiveSonarRange(baseRange, upgrades)` | CoalitionSubmarine | `baseRange * (1 + 0.25 * sonarLevel)` |
| `getMaxStorage(baseStorage, upgrades)` | OilRig | `baseStorage * (1 + 0.5 * storageLevel)` |
| `getDriftRate(minutes, driftRates)` | BalanceMeter | Lookup latest rate ≤ current time |
| `getEscalationMultiplier(minutes, thresholds)` | AIController | Lookup latest multiplier ≤ current time |
| `clampMultiplier(current, change, floor, ceiling)` | TrumpShock | `clamp(current * change, floor, ceiling)` |

## Scene Mock

Minimal object satisfying EconomyManager and BalanceMeter constructors:

```js
export function createSceneMock(overrides = {}) {
  const timers = [];
  return {
    time: {
      now: 0,
      addEvent: (config) => {
        const t = { remove: () => {} };
        timers.push({ config, timer: t });
        return t;
      },
      delayedCall: (delay, cb) => {
        const t = { remove: () => {} };
        timers.push({ delay, cb, timer: t });
        return t;
      },
      paused: false,
    },
    tweens: {
      add: () => ({ destroy: () => {} }),
      killAll: () => {},
      pauseAll: () => {},
      resumeAll: () => {},
    },
    add: {
      text: () => mockChain(),
      graphics: () => mockChain(),
      circle: () => mockChain(),
      rectangle: () => mockChain(),
    },
    trumpShock: { getMultiplier: () => 1.0 },
    _timers: timers,
    ...overrides,
  };
}

function mockChain() {
  const obj = new Proxy({}, {
    get: () => (...args) => obj,
  });
  return obj;
}
```

The `_timers` array lets tests manually trigger timer callbacks to simulate time passing.

## Unit Test Coverage

### `calculations.test.js`
- All 10 pure functions
- Edge cases: 0 upgrades, max upgrades, negative values
- Boundary values from constants (BALANCE.MIN/MAX, multiplier floor/ceiling)

### `economy.test.js`
- `canAfford()` with various oil levels
- `spend()` deducts correctly, rejects if insufficient
- `earn()` adds to correct side
- `registerRig()` / `unregisterRig()` tracks rig arrays
- `collectFromRig()` transfers stored oil to coalition total

### `balance.test.js`
- Initial value is BALANCE.START (0)
- `tick()` drifts value toward negative
- `onTankerScored()` pushes value positive
- `isDefeat()` at MIN, `isVictory()` at MAX
- `getNormalized()` returns correct ratio
- Value clamped between MIN and MAX

## E2E Smoke Test

Replaces `debug-test.mjs`. Uses Playwright Test runner.

```
1. Start Vite dev server (via webServer config in playwright.config.js)
2. Navigate to localhost
3. Collect console errors and page errors
4. Wait 12 seconds (boot sequence + early gameplay)
5. Assert: no pageerror events
6. Assert: no console messages containing "CRASH"
7. Assert: canvas element exists with non-zero dimensions
8. Close browser
```

Runs headless by default. `npm run test:e2e` starts the dev server automatically.

## npm Scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "npx playwright test",
  "test:all": "vitest run && npx playwright test"
}
```

## Dependencies to Install

- `vitest` (devDependency)
- `@playwright/test` (devDependency)

## Entity Refactoring

Entities (Ship, Destroyer, AirDefense, etc.) change minimally:

```js
// Before (in Destroyer):
getEffectiveDamage() {
  return Math.floor(this.stats.damage * (1 + 0.3 * (this.upgrades.DAMAGE || 0)));
}

// After:
import { getEffectiveDamage } from '../utils/calculations.js';
getEffectiveDamage() {
  return getEffectiveDamage(this.stats.damage, this.upgrades.DAMAGE || 0);
}
```

Same behavior, just delegates to the pure function. The entity method remains for Phaser compatibility (other code calls `unit.getEffectiveDamage()`).

## What We Explicitly Don't Test

- Phaser rendering, tweens, particles, sprites
- DOM/HTML UI (UpgradePanel, DeploymentBar, HUD)
- Audio
- Visual correctness (no screenshot comparison)
- AI decision-making (too coupled to random + Phaser timers)
- Entity constructors (require full Phaser scene)

These are covered by the E2E smoke test ("does it crash?") and manual playtesting.
