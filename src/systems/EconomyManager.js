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
        // Trigger stream animation on the rig (non-fatal if animation fails)
        try { if (rig.emitOilStream) rig.emitOilStream(income); } catch (_) {}
      }

      // IRGC rigs: auto-collect (AI doesn't need to click)
      const irgcIncome = this.irgcRigs.length * ECONOMY.OIL_RIG_RATE;
      this.irgcOil += irgcIncome;
    } catch (err) {
      console.error('[EconomyManager.tick] CRASH:', err);
    }
  }

  getEffectiveCost(baseCost) {
    return baseCost;
  }

  canAfford(side, cost) {
    return side === 'coalition'
      ? this.coalitionOil >= cost
      : this.irgcOil >= cost;
  }

  spend(side, cost) {
    if (!this.canAfford(side, cost)) return false;
    if (side === 'coalition') {
      this.coalitionOil = Math.max(0, this.coalitionOil - cost);
    } else {
      this.irgcOil = Math.max(0, this.irgcOil - cost);
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
