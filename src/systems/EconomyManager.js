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
    // Coalition rigs: accumulate oil INTERNALLY (player must click to collect)
    for (const rig of this.coalitionRigs) {
      if (rig.active && rig.addStoredOil) {
        rig.addStoredOil(ECONOMY.OIL_RIG_RATE);
      }
    }

    // IRGC rigs: auto-collect (AI doesn't need to click)
    const irgcIncome = this.irgcRigs.length * ECONOMY.OIL_RIG_RATE;
    this.irgcOil += irgcIncome;
  }

  // Collect oil from a specific coalition rig
  collectFromRig(rig) {
    if (!rig.storedOil || rig.storedOil <= 0) return 0;
    const collected = rig.storedOil;
    rig.storedOil = 0;
    this.coalitionOil += collected;
    return collected;
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
