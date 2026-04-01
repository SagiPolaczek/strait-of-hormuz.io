import Phaser from 'phaser';
import { IRGC_UNITS } from '../config/units.js';
import { IRGC_BUILD_SPOTS, DEFAULT_SHIP_ROUTE } from '../config/zones.js';
import { TIMING, ESCALATION, ECONOMY } from '../config/constants.js';

export class AIController {
  constructor(scene, economy, zoneManager) {
    this.scene = scene;
    this.economy = economy;
    this.zoneManager = zoneManager;
    this.usedSpots = new Set();
    this.extraLauncherPositions = new Set(); // tracks dynamically placed launchers
    this.startTime = Date.now();

    // Pre-sort build spots by proximity to ship route (closest first)
    this.sortedBuildSpots = this.rankBuildSpotsByRouteProximity();

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

  /** Rank IRGC_BUILD_SPOTS by minimum distance to any ship route waypoint. */
  rankBuildSpotsByRouteProximity() {
    return IRGC_BUILD_SPOTS
      .map((spot, originalIndex) => {
        const minDist = Math.min(
          ...DEFAULT_SHIP_ROUTE.map(([wx, wy]) =>
            Math.sqrt((spot.x - wx) ** 2 + (spot.y - wy) ** 2)
          )
        );
        return { spot, originalIndex, minDist };
      })
      .sort((a, b) => a.minDist - b.minDist);
  }

  placeInitialDefenses() {
    // Build 2 rigs early to get economy going faster
    this.tryBuildOilRig();
    this.tryBuildOilRig();
    this.tryBuildLauncher();
  }

  tick() {
    const mult = this.getEscalationMultiplier();
    this.economy.earn('irgc', Math.floor(5 * mult));

    const rigCount = this.economy.irgcRigs.length;

    // More aggressive rig building: target 2 rigs in first 2 min, then +1 every 2 min
    const desiredRigs = 2 + Math.floor(this.getElapsedMinutes() / 2);
    if (rigCount < desiredRigs) {
      this.tryBuildOilRig();
    } else if (this.economy.canAfford('irgc', IRGC_UNITS.MISSILE_LAUNCHER.cost)) {
      this.tryBuildLauncher();
    }
  }

  tryBuildOilRig() {
    const stats = IRGC_UNITS.OIL_RIG;
    // IRGC gets a cost discount on oil rigs
    const cost = Math.floor(stats.cost * (ECONOMY.IRGC_OIL_RIG_COST_MULT || 1));
    if (!this.economy.canAfford('irgc', cost)) return false;

    const zone = this.zoneManager.zoneGraphics.IRGC_OIL;
    if (!zone) return false;

    // IRGC_OIL zone may have multiple geoms — try each
    for (const geom of zone.geoms) {
      const bounds = Phaser.Geom.Polygon.GetAABB(geom);
      for (let attempt = 0; attempt < 10; attempt++) {
        const x = Phaser.Math.Between(bounds.x + 30, bounds.right - 30);
        const y = Phaser.Math.Between(bounds.y + 30, bounds.bottom - 30);
        if (this.zoneManager.isInZone('IRGC_OIL', x, y)) {
          this.economy.spend('irgc', cost);
          this.scene.placeIRGCOilRig(x, y, stats);
          return true;
        }
      }
    }
    return false;
  }

  tryBuildLauncher() {
    const stats = IRGC_UNITS.MISSILE_LAUNCHER;
    if (!this.economy.canAfford('irgc', stats.cost)) return false;

    // First, try pre-defined spots sorted by proximity to ship route
    const available = this.sortedBuildSpots.filter(
      (entry) => !this.usedSpots.has(entry.originalIndex)
    );

    if (available.length > 0) {
      // Pick the closest available spot to the ship route
      const best = available[0];
      this.economy.spend('irgc', stats.cost);
      this.usedSpots.add(best.originalIndex);
      this.scene.placeIRGCLauncher(best.spot.x, best.spot.y, stats);
      return true;
    }

    // All predefined spots used — place at a random valid position within IRGC_BUILD zone
    return this.tryBuildLauncherAtRandomPosition(stats);
  }

  /** Place a launcher at a random position inside the IRGC_BUILD zone. */
  tryBuildLauncherAtRandomPosition(stats) {
    const zone = this.zoneManager.zoneGraphics.IRGC_BUILD;
    if (!zone) return false;

    for (const geom of zone.geoms) {
      const bounds = Phaser.Geom.Polygon.GetAABB(geom);
      for (let attempt = 0; attempt < 20; attempt++) {
        const x = Phaser.Math.Between(bounds.x + 20, bounds.right - 20);
        const y = Phaser.Math.Between(bounds.y + 20, bounds.bottom - 20);

        // Must be inside zone and not too close to an existing launcher
        if (!this.zoneManager.isInZone('IRGC_BUILD', x, y)) continue;

        const posKey = `${Math.round(x / 40)},${Math.round(y / 40)}`;
        if (this.extraLauncherPositions.has(posKey)) continue;

        // Verify minimum spacing from existing launchers (~60px)
        const tooClose = this.scene.irgcTowers.getChildren().some((t) => {
          if (!t.active) return false;
          return Phaser.Math.Distance.Between(x, y, t.x, t.y) < 60;
        });
        if (tooClose) continue;

        this.economy.spend('irgc', stats.cost);
        this.extraLauncherPositions.add(posKey);
        this.scene.placeIRGCLauncher(x, y, stats);
        return true;
      }
    }
    return false;
  }
}
