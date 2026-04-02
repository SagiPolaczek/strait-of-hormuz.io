import { ECONOMY, TIMING } from '../config/constants.js';

export class EconomyManager {
  constructor(scene) {
    this.scene = scene;
    this.coalitionOil = ECONOMY.COALITION_START_OIL;
    this.irgcOil = ECONOMY.IRGC_START_OIL;
    this.coalitionRigs = [];
    this.irgcRigs = [];

    this.scene.time.addEvent({
      delay: TIMING.OIL_TICK_MS,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });
  }

  tick() {
    try {
      // Trump shock oil multiplier (affects coalition income)
      const trumpMult = this.scene.trumpShock?.getMultiplier() || 1;

      // Coalition rigs: auto-collect directly into oil reserves
      for (const rig of this.coalitionRigs) {
        if (!rig.active) continue;
        const drillMult = 1 + 0.3 * (rig.upgrades?.DRILL_RATE || 0);
        const reservesMult = 1 + 0.2 * (rig.upgrades?.STORAGE || 0);
        const income = ECONOMY.OIL_RIG_RATE * drillMult * reservesMult * trumpMult;
        this.coalitionOil += income;
        // Trigger stream animation on the rig
        if (rig.emitOilStream) rig.emitOilStream(income);
      }

      // IRGC rigs: auto-collect (AI doesn't need to click)
      const irgcIncome = this.irgcRigs.length * ECONOMY.OIL_RIG_RATE;
      this.irgcOil += irgcIncome;
    } catch (err) {
      console.error('[EconomyManager.tick] CRASH:', err);
    }
  }

  // Collect oil from a specific coalition rig
  collectFromRig(rig) {
    if (!rig.storedOil || rig.storedOil <= 0) return 0;
    const collected = rig.storedOil;
    rig.storedOil = 0;
    this.coalitionOil += collected;
    return collected;
  }

  // Get the effective cost of a unit, scaled by Trump oil shock
  // High oil prices = everything costs more, low prices = cheaper
  getEffectiveCost(baseCost) {
    const mult = this.scene.trumpShock?.getMultiplier() || 1;
    return Math.floor(baseCost * mult);
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
