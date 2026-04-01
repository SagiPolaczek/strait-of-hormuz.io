import Phaser from 'phaser';
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

    this.scene.time.addEvent({
      delay: TIMING.AI_TICK_MS,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });

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
    this.tryBuildOilRig();
    this.tryBuildLauncher();
  }

  tick() {
    const mult = this.getEscalationMultiplier();
    this.economy.earn('irgc', Math.floor(5 * mult));

    const rigCount = this.economy.irgcRigs.length;

    if (rigCount < 1 + Math.floor(this.getElapsedMinutes() / 3)) {
      this.tryBuildOilRig();
    } else if (this.economy.canAfford('irgc', IRGC_UNITS.MISSILE_LAUNCHER.cost)) {
      this.tryBuildLauncher();
    }
  }

  tryBuildOilRig() {
    const stats = IRGC_UNITS.OIL_RIG;
    if (!this.economy.canAfford('irgc', stats.cost)) return false;

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
