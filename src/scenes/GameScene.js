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

    // Click handler — place units on the map
    this.input.on('pointerdown', (pointer) => this.handleMapClick(pointer));
  }

  update() {
    try {
      this.combat.update();
      this.hud.update(this.score);
      this.deployBar.update();
      this.checkGameOver();
    } catch (err) {
      console.error('[GameScene.update] CRASH:', err);
    }
  }

  handleMapClick(pointer) {
    const { x, y } = pointer;

    // Ignore clicks on HUD (top ~55px) or deployment bar (starts at y=1459)
    if (y < 55 || y > 1455) return;

    // If no unit selected, check if clicking on a coalition oil rig to collect
    const unit = this.deployBar.getSelectedUnit();
    console.log(`[Click] pos=(${Math.round(x)},${Math.round(y)}) unit=${unit?.key || 'none'}`);

    if (!unit) {
      this.tryCollectOilRig(x, y);
      return;
    }

    // Check if placement is in correct zone
    const inZone = this.zoneManager.isInZone(unit.zone, x, y);
    console.log(`[Click] zone=${unit.zone} inZone=${inZone}`);

    if (!inZone) {
      this.showMessage(x, y, '⚠ WRONG ZONE', '#ef5350');
      // Flash the correct zone to guide the player
      this.zoneManager.flashCoalitionZones(unit.key);
      return;
    }

    // Check if player can afford it
    if (!this.economy.canAfford('coalition', unit.cost)) {
      this.showMessage(x, y, '❌ Not enough oil!', '#ef5350');
      return;
    }

    // Spend oil and place/deploy unit
    console.log(`[Click] PLACING ${unit.key} at (${Math.round(x)},${Math.round(y)})`);
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

  tryCollectOilRig(x, y) {
    const rigs = this.coalitionRigs.getChildren();
    for (const rig of rigs) {
      if (!rig.active || rig.side !== 'coalition') continue;
      const dist = Phaser.Math.Distance.Between(x, y, rig.x, rig.y);
      if (dist < OIL_COLLECTION.CLICK_RADIUS && rig.storedOil > 0) {
        const collected = this.economy.collectFromRig(rig);
        if (collected > 0) {
          rig.showCollectionEffect(Math.floor(collected));
        }
        return;
      }
    }
  }

  placeCoalitionOilRig(x, y, stats) {
    const rig = new OilRig(this, x, y, 'coalition', stats);
    this.coalitionRigs.add(rig);
    this.economy.registerRig('coalition', rig);
    this.showPlacementConfirmation(x, y);
  }

  deployShip(clickX, clickY, stats, ShipClass) {
    // Ship picks its own random route — create at its route's start position
    const route = SHIP_ROUTES[Math.floor(Math.random() * SHIP_ROUTES.length)];
    const [startX, startY] = route[0];
    const ship = new ShipClass(this, startX, startY, stats);
    ship.waypoints = [...route]; // override with the same route we picked
    this.coalitionShips.add(ship);

    // Visual feedback at click location
    this.showPlacementConfirmation(clickX, clickY);

    // Visual indicator at route start — flash to show where ship actually spawns
    this.showDeployIndicator(startX, startY);
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

  checkGameOver() {
    // Grace period — don't check game over for the first N seconds
    if (this.time.now - this.createTime < TIMING.GAME_OVER_GRACE_MS) return;

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
