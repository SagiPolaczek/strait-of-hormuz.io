import Phaser from 'phaser';
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
import { TIMING, OIL_COLLECTION } from '../config/constants.js';
import { SHIP_ROUTES } from '../config/zones.js';
import { BalanceMeter } from '../systems/BalanceMeter.js';
import { BalanceMeterUI } from '../ui/BalanceMeterUI.js';
import { UpgradePanel } from '../ui/UpgradePanel.js';
import { LeaderboardManager } from '../systems/LeaderboardManager.js';
import { TrumpShock } from '../systems/TrumpShock.js';
import { AirDefense } from '../entities/AirDefense.js';
import { Airfield } from '../entities/Airfield.js';
import { CoalitionSubmarine } from '../entities/CoalitionSubmarine.js';
import { ADVANCED } from '../config/constants.js';
import { AudioManager } from '../systems/AudioManager.js';
import { SettingsModal } from '../ui/SettingsModal.js';
import { isMobile } from '../utils/mobile.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    // Background — satellite map
    this.add.image(960, 770, 'map').setDisplaySize(1920, 1539);

    // Phaser groups for entity management
    this.coalitionShips = this.add.group();
    this.irgcTowers = this.add.group();
    this.coalitionRigs = this.add.group();
    this.irgcRigs = this.add.group();
    this.projectiles = this.add.group();
    this.mines = this.add.group();
    this.irgcAir = this.add.group();
    this.coalitionDefenses = this.add.group();
    this.irgcBoats = this.add.group();
    this.coalitionAir = this.add.group();

    // Systems
    this.zoneManager = new ZoneManager(this);
    this.economy = new EconomyManager(this);
    this.ai = new AIController(this, this.economy, this.zoneManager);
    this.combat = new CombatManager(this);

    // UI
    this.hud = new HUD(this, this.economy);
    this.deployBar = new DeploymentBar(this, this.economy);

    // Score tracking
    this.score = 0;

    // Track scene creation time for grace period
    this.createTime = this.time.now;
    this._gameEnded = false;

    // Balance meter (tug-of-war win condition)
    this.balanceMeter = new BalanceMeter(this);
    this.balanceMeterUI = new BalanceMeterUI(this, this.balanceMeter);

    // Global upgrades — per-type, shared across all units
    this.globalUpgrades = {
      OIL_RIG: {},
      TANKER: {},
      DESTROYER: {},
      AIR_DEFENSE: {},
      AIRFIELD: {},
      COALITION_SUB: {},
    };

    // Upgrade panel (left side)
    this.upgradePanel = new UpgradePanel(this, this.economy);

    // Trump oil shock events
    this.trumpShock = new TrumpShock(this, this.economy);

    // Advanced weapons unlock at 3 minutes
    this.advancedUnlocked = false;
    this.time.delayedCall(ADVANCED.UNLOCK_TIME_MS, () => this._onAdvancedUnlock());

    // Audio manager (shared singleton)
    if (!window._audioManager) window._audioManager = new AudioManager();
    this.audio = window._audioManager;

    // Settings modal
    this.settingsModal = new SettingsModal(this, this.audio);
    this.hud._onSettingsClick = () => this.toggleSettings();
    this._settingsOpen = false;

    // ESC key toggles settings
    this.input.keyboard.on('keydown-ESC', () => this.toggleSettings());

    // Cheat code: type "iloveoil" for infinite oil
    this._cheatBuffer = '';
    this.input.keyboard.on('keydown', (event) => {
      if (this._settingsOpen || event.key.length !== 1) return;
      this._cheatBuffer += event.key.toLowerCase();
      if (this._cheatBuffer.length > 20) this._cheatBuffer = this._cheatBuffer.slice(-20);
      if (this._cheatBuffer.endsWith('iloveoil')) {
        this._cheatBuffer = '';
        this._activateOilCheat();
      }
      if (this._cheatBuffer.endsWith('unlockall')) {
        this._cheatBuffer = '';
        this._activateUnlockCheat();
      }
    });

    // Zone outline graphics for unit selection guidance
    this._zoneOutlines = [];

    // Range circle for selected unit
    this._rangeCircle = null;
    this._rangeUnit = null;

    // Cleanup on scene shutdown
    this.events.on('shutdown', () => {
      this.tweens.killAll();
      this.time.removeAllEvents();
      this._clearZoneOutlines();
      this._clearRangeCircle();
    });

    // Click handler — place units on the map
    this.input.on('pointerdown', (pointer) => this.handleMapClick(pointer));

    // Watch for deployment bar selection changes to show zone outlines
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const unit = this.deployBar.getSelectedUnit();
        const currentKey = unit?.key || null;
        if (currentKey !== this._lastDeploySelection) {
          this._lastDeploySelection = currentKey;
          if (currentKey) {
            this.showZoneOutlines(currentKey);
          } else {
            this._clearZoneOutlines();
          }
        }
      },
    });
  }

  update() {
    if (this._settingsOpen) return;
    try {
      this.combat.update();
      this.hud.update(this.score);
      this.deployBar.update();
      this.balanceMeterUI.update();
      this.upgradePanel.update();
      this._updateRangeCircle();
      this.checkGameOver();
    } catch (err) {
      console.error('[GameScene.update] CRASH:', err);
    }
  }

  handleMapClick(pointer) {
    if (this._settingsOpen) return;
    const { x, y } = pointer;

    // Ignore clicks on HUD (top ~70px) or deployment bar (starts at y=1443)
    if (y < 82 || y > 1428) return;

    const unit = this.deployBar.getSelectedUnit();

    // Always check if clicking a coalition unit — show upgrade panel
    const clickedUnit = this.findCoalitionUnitAt(x, y);
    if (clickedUnit) {
      // Collect oil if it's a rig with stored oil
      if (clickedUnit.storedOil > 0 && clickedUnit.side === 'coalition') {
        const collected = this.economy.collectFromRig(clickedUnit);
        if (collected > 0) { clickedUnit.showCollectionEffect(Math.floor(collected)); this.audio.collectOil(); }
      }
      this.upgradePanel.show(clickedUnit);
      this._showRangeCircle(clickedUnit);
      if (!unit) return; // No deploy unit selected, just show upgrades
    } else {
      // Check if clicking an enemy unit — show intel
      const enemyUnit = this.findEnemyUnitAt(x, y);
      if (enemyUnit) {
        this.upgradePanel.showEnemyIntel(enemyUnit);
        this._clearRangeCircle();
        if (!unit) return;
      } else {
        // Check if a destroyer is selected — send move command instead of deselecting
        const selectedUnit = this.upgradePanel.selectedUnit;
        if (!unit && selectedUnit?.stats?.key === 'DESTROYER' && selectedUnit.active && selectedUnit.alive) {
          if (this.zoneManager.isInWater(x, y)) {
            selectedUnit.setCommand(x, y);
            this._showMoveCommand(x, y);
            this.audio.place();
            return;
          }
        }
        // Clicked empty space — deselect
        this.upgradePanel.deselect();
        this._clearRangeCircle();
      }
    }

    if (!unit) {
      if (!clickedUnit) this.tryCollectOilRig(x, y);
      return;
    }

    // Check if placement is in correct zone
    const inZone = this.zoneManager.isInZone(unit.zone, x, y);

    if (!inZone) {
      this.showMessage(x, y, '⚠ WRONG ZONE', '#ef5350');
      this.audio.error();
      // Flash the correct zone to guide the player
      this.zoneManager.flashCoalitionZones(unit.key);
      return;
    }

    // Check if player can afford it (Trump oil shock affects costs)
    const effectiveCost = this.economy.getEffectiveCost(unit.cost);
    if (!this.economy.canAfford('coalition', effectiveCost)) {
      this.showMessage(x, y, '❌ Not enough oil!', '#ef5350');
      this.audio.error();
      return;
    }

    // Spend oil and place/deploy unit
    this.economy.spend('coalition', effectiveCost);

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
      case 'AIR_DEFENSE':
        this.placeAirDefense(x, y, unit);
        break;
      case 'AIRFIELD':
        this.placeAirfield(x, y, unit);
        break;
      case 'COALITION_SUB':
        this.deploySubmarine(x, y, unit);
        break;
    }

    this.deployBar.clearSelection();
    this._clearZoneOutlines();
  }

  tryCollectOilRig(x, y) {
    const rigs = this.coalitionRigs.getChildren();
    for (const rig of rigs) {
      if (!rig.active || rig.side !== 'coalition') continue;
      const dist = Phaser.Math.Distance.Between(x, y, rig.x, rig.y);
      const tapRadius = isMobile ? 80 : OIL_COLLECTION.CLICK_RADIUS;
      if (dist < tapRadius && rig.storedOil > 0) {
        const collected = this.economy.collectFromRig(rig);
        if (collected > 0) {
          rig.showCollectionEffect(Math.floor(collected));
          this.audio.collectOil();
        }
        return;
      }
    }
  }

  placeCoalitionOilRig(x, y, stats) {
    const rig = new OilRig(this, x, y, 'coalition', stats);
    this.coalitionRigs.add(rig);
    this.economy.registerRig('coalition', rig);
    this._applyGlobalUpgrades(rig);
    this.showPlacementConfirmation(x, y);
    this.audio.place();
  }

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
    const trumpMult = this.trumpShock?.getMultiplier() || 1;
    const earned = Math.floor(tanker.stats.oilBonus * trumpMult);
    this.economy.earn('coalition', earned);
    this.balanceMeter.onTankerScored();
    this.audio.tankerScored();
    return earned;
  }

  placeAirDefense(x, y, stats) {
    const ad = new AirDefense(this, x, y, stats);
    this.coalitionDefenses.add(ad);
    this._applyGlobalUpgrades(ad);
    this.showPlacementConfirmation(x, y);
  }

  placeAirfield(x, y, stats) {
    const af = new Airfield(this, x, y, stats);
    this.coalitionDefenses.add(af);
    this._applyGlobalUpgrades(af);
    this.showPlacementConfirmation(x, y);
    this.audio.place();
  }

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

  /** Apply all current global upgrades to a newly created coalition unit */
  _applyGlobalUpgrades(unit) {
    const typeKey = unit.stats?.key;
    if (!typeKey || !this.globalUpgrades[typeKey]) return;
    const upgrades = this.globalUpgrades[typeKey];
    for (const [key, level] of Object.entries(upgrades)) {
      for (let i = 0; i < level; i++) {
        if (unit.applyUpgrade) unit.applyUpgrade(key);
      }
    }
  }

  _onAdvancedUnlock() {
    this.advancedUnlocked = true;

    const banner = this.add.text(960, 450, '⚠ ADVANCED THREATS INCOMING ⚠', {
      fontSize: '32px', fontFamily: '"Black Ops One", cursive',
      color: '#ef5350', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(200);

    const sub = this.add.text(960, 495, 'MISSILES • DRONES • FAST BOATS — DEPLOY DEFENSES NOW', {
      fontSize: '14px', fontFamily: '"Share Tech Mono", monospace',
      color: '#ff9800', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: sub, alpha: 1, duration: 400, delay: 400,
    });

    // Flash screen
    const flash = this.add.rectangle(960, 770, 1920, 1539, 0xFFD54F, 0).setDepth(199);
    this.tweens.add({
      targets: flash, fillAlpha: { from: 0, to: 0.15 },
      duration: 200, yoyo: true,
    });

    this.tweens.add({
      targets: [banner, sub], alpha: 0, duration: 500, delay: 3000,
      onComplete: () => { banner.destroy(); sub.destroy(); flash.destroy(); },
    });
  }

  findCoalitionUnitAt(x, y) {
    const radius = isMobile ? 80 : 45;
    for (const rig of this.coalitionRigs.getChildren()) {
      if (!rig.active || rig.side !== 'coalition') continue;
      if (Phaser.Math.Distance.Between(x, y, rig.x, rig.y) < radius) return rig;
    }
    for (const ship of this.coalitionShips.getChildren()) {
      if (!ship.active || !ship.alive) continue;
      if (Phaser.Math.Distance.Between(x, y, ship.x, ship.y) < radius) return ship;
    }
    for (const def of this.coalitionDefenses.getChildren()) {
      if (!def.active) continue;
      if (Phaser.Math.Distance.Between(x, y, def.x, def.y) < radius) return def;
    }
    return null;
  }

  findEnemyUnitAt(x, y) {
    const radius = isMobile ? 90 : 50;
    for (const t of this.irgcTowers.getChildren()) {
      if (!t.active) continue;
      if (Phaser.Math.Distance.Between(x, y, t.x, t.y) < radius) return t;
    }
    for (const r of this.irgcRigs.getChildren()) {
      if (!r.active) continue;
      if (Phaser.Math.Distance.Between(x, y, r.x, r.y) < radius) return r;
    }
    for (const m of this.mines.getChildren()) {
      if (!m.active || !m.detected) continue; // only detected mines
      if (Phaser.Math.Distance.Between(x, y, m.x, m.y) < radius) return m;
    }
    for (const a of this.irgcAir.getChildren()) {
      if (!a.active || !a.alive) continue;
      if (Phaser.Math.Distance.Between(x, y, a.x, a.y) < radius) return a;
    }
    for (const b of this.irgcBoats.getChildren()) {
      if (!b.active || !b.alive) continue;
      if (b.isSub && b.submerged && !b.detected) continue;
      if (Phaser.Math.Distance.Between(x, y, b.x, b.y) < radius) return b;
    }
    return null;
  }

  /** Green circle expanding and fading — placement/deploy confirmation. */
  showPlacementConfirmation(x, y) {
    const circle = this.add.circle(x, y, 8, 0x4caf50, 0.6).setDepth(150);
    this.tweens.add({
      targets: circle,
      radius: 30,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => circle.destroy(),
    });
  }

  /** Flash indicator at ship route start when a ship is deployed. */
  showDeployIndicator(x, y) {
    const ring = this.add.circle(x, y, 20, 0x2196f3, 0).setStrokeStyle(3, 0x2196f3, 0.8).setDepth(150);
    const label = this.add.text(x, y - 30, '⚓ Deployed', {
      fontSize: '13px', color: '#64b5f6', fontFamily: '"Share Tech Mono", monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: ring,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: label,
      y: label.y - 20,
      alpha: 0,
      duration: 800,
      onComplete: () => label.destroy(),
    });
  }

  showMessage(x, y, text, color) {
    const msg = this.add.text(x, y - 20, text, {
      fontSize: '14px', color, fontFamily: '"Share Tech Mono", monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: msg, y: msg.y - 30, alpha: 0, duration: 800,
      onComplete: () => msg.destroy(),
    });
  }

  _showMoveCommand(x, y) {
    // Crosshair marker at destination
    const marker = this.add.graphics().setDepth(150);
    marker.lineStyle(2, 0x42a5f5, 0.8);
    // Crosshair lines
    marker.lineBetween(x - 10, y, x + 10, y);
    marker.lineBetween(x, y - 10, x, y + 10);
    // Patrol radius circle (dashed)
    marker.lineStyle(1.5, 0x42a5f5, 0.3);
    marker.strokeCircle(x, y, 80);

    // "MOVE" label
    const label = this.add.text(x, y - 18, 'MOVE', {
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace',
      color: '#42a5f5', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(150);

    // Expanding ring
    const ring = this.add.circle(x, y, 8, 0x42a5f5, 0.5).setDepth(149);
    this.tweens.add({
      targets: ring, scaleX: 3, scaleY: 3, alpha: 0,
      duration: 600, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Fade out marker and label
    this.tweens.add({
      targets: [marker, label], alpha: 0, duration: 500, delay: 1500,
      onComplete: () => { marker.destroy(); label.destroy(); },
    });
  }

  showZoneOutlines(unitKey) {
    this._clearZoneOutlines();
    let zoneName;
    if (unitKey === 'OIL_RIG') zoneName = 'COALITION_OIL';
    else if (unitKey === 'AIR_DEFENSE' || unitKey === 'AIRFIELD') zoneName = 'COALITION_LAND';
    else zoneName = 'COALITION_DEPLOY';
    const outlines = this.zoneManager.createZoneOutlines(zoneName);
    this._zoneOutlines = outlines;
  }

  _clearZoneOutlines() {
    if (this._zoneOutlines) {
      this._zoneOutlines.forEach(gfx => { if (gfx?.active) gfx.destroy(); });
      this._zoneOutlines = [];
    }
  }

  _showRangeCircle(unit) {
    this._clearRangeCircle();
    const range = unit.getEffectiveRange?.() || unit.stats?.range;
    if (!range) return;

    this._rangeUnit = unit;
    this._rangeCircle = this.add.graphics().setDepth(3);
    this._drawRangeCircle(unit.x, unit.y, range);
  }

  _drawRangeCircle(x, y, range) {
    const gfx = this._rangeCircle;
    if (!gfx?.active) return;
    gfx.clear();

    // Filled area
    gfx.fillStyle(0x42a5f5, 0.06);
    gfx.fillCircle(x, y, range);

    // Dashed border
    const segments = 40;
    const segAngle = (2 * Math.PI) / segments;
    gfx.lineStyle(1.5, 0x42a5f5, 0.35);
    for (let i = 0; i < segments; i += 2) {
      const a1 = i * segAngle;
      const a2 = (i + 1) * segAngle;
      gfx.beginPath();
      gfx.arc(x, y, range, a1, a2, false);
      gfx.strokePath();
    }

    // Sonar range (submarine secondary ring)
    const sonarRange = this._rangeUnit?.getEffectiveSonarRange?.();
    if (sonarRange && sonarRange !== range) {
      gfx.lineStyle(1, 0x00bcd4, 0.2);
      gfx.strokeCircle(x, y, sonarRange);
    }
  }

  _updateRangeCircle() {
    if (!this._rangeUnit || !this._rangeCircle?.active) return;
    if (!this._rangeUnit.active) { this._clearRangeCircle(); return; }
    const range = this._rangeUnit.getEffectiveRange?.() || this._rangeUnit.stats?.range;
    if (!range) return;
    this._drawRangeCircle(this._rangeUnit.x, this._rangeUnit.y, range);
  }

  _clearRangeCircle() {
    if (this._rangeCircle?.active) this._rangeCircle.destroy();
    this._rangeCircle = null;
    this._rangeUnit = null;
  }

  toggleSettings() {
    this.settingsModal.toggle();
  }

  pauseGame() {
    this._settingsOpen = true;
    this.time.paused = true;
    this.tweens.pauseAll();
    this.hud.onPause();
    this.balanceMeter.onPause();
    this.ai.onPause();
  }

  resumeGame() {
    this._settingsOpen = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.hud.onResume();
    this.balanceMeter.onResume();
    this.ai.onResume();
  }

  checkGameOver() {
    if (this._gameEnded) return;

    // Balance meter win/lose (primary condition)
    if (this.balanceMeter.isDefeat()) {
      this.endGame('defeat');
      return;
    }
    if (this.balanceMeter.isVictory()) {
      this.endGame('victory');
      return;
    }

    // Resource exhaustion fallback (with grace period)
    if (this.time.now - this.createTime < TIMING.GAME_OVER_GRACE_MS) return;

    const oil = this.economy.coalitionOil;
    const rigs = this.economy.coalitionRigs.length;
    const ships = this.coalitionShips.getLength();
    const cheapest = Math.min(...Object.values(COALITION_UNITS).map(u => u.cost));

    if (rigs === 0 && ships === 0 && oil < cheapest) {
      this.endGame('defeat');
    }
  }

  endGame(outcome) {
    if (this._gameEnded) return;
    this._gameEnded = true;
    this.balanceMeter.ended = true;

    const data = {
      score: this.score,
      time: this.hud.getTimeString(),
      timeSeconds: Math.floor((Date.now() - this.hud.startTime - this.hud._totalPauseMs) / 1000),
      outcome,
      balance: Math.round(this.balanceMeter.value),
    };

    if (outcome === 'victory') this.audio.victory();
    else this.audio.defeat();

    LeaderboardManager.save(data);
    this.scene.start('GameOver', data);
  }

  _activateOilCheat() {
    this.economy.coalitionOil = 999999;

    // Screen flash
    const flash = this.add.rectangle(960, 770, 1920, 1539, 0xFFD54F, 0).setDepth(250);
    this.tweens.add({
      targets: flash, fillAlpha: { from: 0, to: 0.25 },
      duration: 150, yoyo: true,
      onComplete: () => flash.destroy(),
    });

    // Banner
    const banner = this.add.text(960, 400, '🛢️ UNLIMITED OIL RESERVES 🛢️', {
      fontSize: '36px', fontFamily: '"Black Ops One", cursive',
      color: '#FFD54F', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(251).setAlpha(0);

    const sub = this.add.text(960, 450, 'EXECUTIVE ORDER APPROVED', {
      fontSize: '14px', fontFamily: '"Share Tech Mono", monospace',
      color: '#ffb300', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(251).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 400, ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: sub, alpha: 1, duration: 300, delay: 300 });
    this.tweens.add({
      targets: [banner, sub], alpha: 0, duration: 500, delay: 3000,
      onComplete: () => { banner.destroy(); sub.destroy(); },
    });
  }

  _activateUnlockCheat() {
    this.advancedUnlocked = true;

    // Screen flash
    const flash = this.add.rectangle(960, 770, 1920, 1539, 0x00e5ff, 0).setDepth(250);
    this.tweens.add({
      targets: flash, fillAlpha: { from: 0, to: 0.2 },
      duration: 150, yoyo: true,
      onComplete: () => flash.destroy(),
    });

    // Banner
    const banner = this.add.text(960, 400, '🔓 ALL SYSTEMS UNLOCKED 🔓', {
      fontSize: '36px', fontFamily: '"Black Ops One", cursive',
      color: '#00e5ff', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(251).setAlpha(0);

    const sub = this.add.text(960, 450, 'PENTAGON AUTHORIZATION OVERRIDE', {
      fontSize: '14px', fontFamily: '"Share Tech Mono", monospace',
      color: '#42a5f5', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(251).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 400, ease: 'Back.easeOut',
    });
    this.tweens.add({ targets: sub, alpha: 1, duration: 300, delay: 300 });
    this.tweens.add({
      targets: [banner, sub], alpha: 0, duration: 500, delay: 3000,
      onComplete: () => { banner.destroy(); sub.destroy(); },
    });
  }
}
