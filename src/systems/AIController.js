import Phaser from 'phaser';
import { IRGC_UNITS } from '../config/units.js';
import { IRGC_BUILD_SPOTS, DEFAULT_SHIP_ROUTE, SHIP_ROUTES } from '../config/zones.js';
import { TIMING, ESCALATION, ECONOMY, ADVANCED } from '../config/constants.js';
import { Mine } from '../entities/Mine.js';
import { CruiseMissile } from '../entities/CruiseMissile.js';
import { ExplodingUAV } from '../entities/ExplodingUAV.js';
import { FastBoat } from '../entities/FastBoat.js';
import { MiniSubmarine } from '../entities/MiniSubmarine.js';

export class AIController {
  constructor(scene, economy, zoneManager) {
    this.scene = scene;
    this.economy = economy;
    this.zoneManager = zoneManager;
    this.usedSpots = new Set();
    this.extraLauncherPositions = new Set(); // tracks dynamically placed launchers
    this.startTime = Date.now();
    this._totalPauseMs = 0;
    this._pauseStart = 0;

    // Pre-sort build spots by proximity to ship route (closest first)
    this.sortedBuildSpots = this.rankBuildSpotsByRouteProximity();

    this.scene.time.addEvent({
      delay: TIMING.AI_TICK_MS,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });

    this.scene.time.delayedCall(5000, () => this.placeInitialDefenses());

    // Mine spawning (starts at 2 minutes)
    this.scene.time.delayedCall(ADVANCED.MINE_START_MS, () => {
      this._spawnMines();
      this.scene.time.addEvent({
        delay: ADVANCED.MINE_INTERVAL_MS,
        callback: () => this._spawnMines(),
        loop: true,
      });
    });

    // Advanced weapons — warning at 3:00, air units spawn at 3:10 (10s grace period)
    this.scene.time.delayedCall(ADVANCED.UNLOCK_TIME_MS + 10000, () => {
      this.scene.time.addEvent({
        delay: ADVANCED.CRUISE_MISSILE_INTERVAL_MS,
        callback: () => this._launchCruiseMissile(),
        loop: true,
      });
      this.scene.time.addEvent({
        delay: ADVANCED.UAV_SWARM_INTERVAL_MS,
        callback: () => this._launchUAVSwarm(),
        loop: true,
      });
    });

    // Fast boat swarms (start at 2 minutes)
    this.scene.time.delayedCall(ADVANCED.FAST_BOAT_START_MS, () => {
      this._launchFastBoatSwarm(); // first swarm immediately
      this.scene.time.addEvent({
        delay: ADVANCED.FAST_BOAT_INTERVAL_MS,
        callback: () => this._launchFastBoatSwarm(),
        loop: true,
      });
    });

    // IRGC mini-submarines (start at 5 minutes)
    this.scene.time.delayedCall(ADVANCED.SUBMARINE_START_MS, () => {
      this._deploySubmarine();
      this.scene.time.addEvent({
        delay: ADVANCED.SUBMARINE_INTERVAL_MS,
        callback: () => this._deploySubmarine(),
        loop: true,
      });
    });
  }

  onPause() {
    this._pauseStart = Date.now();
  }

  onResume() {
    if (this._pauseStart) {
      this._totalPauseMs += Date.now() - this._pauseStart;
      this._pauseStart = 0;
    }
  }

  _spawnMines() {
    for (let i = 0; i < ADVANCED.MINES_PER_BATCH; i++) {
      const route = SHIP_ROUTES[Math.floor(Math.random() * SHIP_ROUTES.length)];
      const wpIdx = Math.floor(Math.random() * (route.length - 2)) + 1;
      const [wx, wy] = route[wpIdx];
      const x = wx + Phaser.Math.Between(-50, 50);
      const y = wy + Phaser.Math.Between(-50, 50);
      const mine = new Mine(this.scene, x, y);
      if (this.scene.mines) this.scene.mines.add(mine);
    }
  }

  _launchCruiseMissile() {
    const x = Phaser.Math.Between(800, 1800);
    const y = Phaser.Math.Between(50, 150);
    const missile = new CruiseMissile(this.scene, x, y);
    if (this.scene.irgcAir) this.scene.irgcAir.add(missile);
  }

  _launchUAVSwarm() {
    const spot = IRGC_BUILD_SPOTS[Math.floor(Math.random() * IRGC_BUILD_SPOTS.length)];
    for (let i = 0; i < ADVANCED.UAV_PER_SWARM; i++) {
      const x = spot.x + Phaser.Math.Between(-30, 30);
      const y = spot.y + Phaser.Math.Between(-30, 30);
      const uav = new ExplodingUAV(this.scene, x, y);
      if (this.scene.irgcAir) this.scene.irgcAir.add(uav);
    }
  }

  _launchFastBoatSwarm() {
    const minutes = this.getElapsedMinutes();

    // Scale swarm size: 5 → 8 → 12 → 15 over time
    let count = ADVANCED.FAST_BOAT_BASE_COUNT;
    if (minutes >= 8) count = 15;
    else if (minutes >= 6) count = 12;
    else if (minutes >= 4) count = 8;

    // Suicide ratio: 40% early → 50% late (spec: 2/5 early)
    const suicideRatio = minutes >= 6 ? 0.5 : 0.4;
    const suicideCount = Math.floor(count * suicideRatio);

    // HUD warning
    this._showSwarmWarning();

    // Spawn from multiple points along Iranian coast (top of map)
    const spawnZones = [
      { x: Phaser.Math.Between(300, 600), y: Phaser.Math.Between(100, 250) },
      { x: Phaser.Math.Between(700, 1000), y: Phaser.Math.Between(80, 200) },
      { x: Phaser.Math.Between(1100, 1500), y: Phaser.Math.Between(100, 280) },
    ];

    for (let i = 0; i < count; i++) {
      const zone = spawnZones[i % spawnZones.length];
      const x = zone.x + Phaser.Math.Between(-40, 40);
      const y = zone.y + Phaser.Math.Between(-20, 20);
      const variant = i < suicideCount ? 'suicide' : 'gun';
      const boat = new FastBoat(this.scene, x, y, variant);
      if (this.scene.irgcBoats) this.scene.irgcBoats.add(boat);
    }
  }

  _showSwarmWarning() {
    const banner = this.scene.add.text(960, 400, '⚠ SWARM INCOMING ⚠', {
      fontSize: '28px', fontFamily: '"Black Ops One", cursive',
      color: '#ff4444', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.scene.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: banner, alpha: 0, duration: 400, delay: 2000,
      onComplete: () => banner.destroy(),
    });
  }

  _deploySubmarine() {
    // Spawn from Iranian coast, near ship routes
    const route = SHIP_ROUTES[Math.floor(Math.random() * SHIP_ROUTES.length)];
    const wpIdx = Math.floor(Math.random() * Math.min(3, route.length));
    const [wx, wy] = route[wpIdx];
    // Offset toward Iranian coast (north)
    const x = wx + Phaser.Math.Between(-60, 60);
    const y = Math.max(100, wy - Phaser.Math.Between(50, 150));

    const sub = new MiniSubmarine(this.scene, x, y);
    if (this.scene.irgcBoats) this.scene.irgcBoats.add(sub);
  }

  getElapsedMinutes() {
    return (Date.now() - this.startTime - this._totalPauseMs) / 60000;
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
    this.economy.earn('irgc', Math.floor(3 * mult));

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
