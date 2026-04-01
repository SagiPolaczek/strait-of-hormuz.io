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
import { DEFAULT_SHIP_ROUTE } from '../config/zones.js';

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

    // Click handler — place units on the map
    this.input.on('pointerdown', (pointer) => this.handleMapClick(pointer));

    // Draw faint ship route preview
    this.drawRoutePreview();
  }

  update() {
    this.combat.update();
    this.hud.update(this.score);
    this.deployBar.update();
    this.checkGameOver();
  }

  handleMapClick(pointer) {
    const { x, y } = pointer;

    // Ignore clicks on HUD (top 50px) or deployment bar (bottom 70px)
    if (y < 50 || y > 1490) return;

    const unit = this.deployBar.getSelectedUnit();
    if (!unit) return;

    // Check if placement is in correct zone
    if (!this.zoneManager.isInZone(unit.zone, x, y)) {
      this.showMessage(x, y, '❌ Wrong zone!', '#ef5350');
      return;
    }

    // Check if player can afford it
    if (!this.economy.canAfford('coalition', unit.cost)) {
      this.showMessage(x, y, '❌ Not enough oil!', '#ef5350');
      return;
    }

    // Spend oil and place/deploy unit
    this.economy.spend('coalition', unit.cost);

    switch (unit.key) {
      case 'OIL_RIG':
        this.placeCoalitionOilRig(x, y, unit);
        break;
      case 'TANKER':
        this.deployShip(unit, Tanker);
        break;
      case 'DESTROYER':
        this.deployShip(unit, Destroyer);
        break;
    }

    this.deployBar.clearSelection();
  }

  placeCoalitionOilRig(x, y, stats) {
    const rig = new OilRig(this, x, y, 'coalition', stats);
    this.coalitionRigs.add(rig);
    this.economy.registerRig('coalition', rig);
  }

  deployShip(stats, ShipClass) {
    const [startX, startY] = DEFAULT_SHIP_ROUTE[0];
    const ship = new ShipClass(this, startX, startY, stats);
    this.coalitionShips.add(ship);
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

  drawRoutePreview() {
    const gfx = this.add.graphics();
    gfx.lineStyle(2, 0xffffff, 0.15);
    gfx.beginPath();
    DEFAULT_SHIP_ROUTE.forEach(([x, y], i) => {
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    });
    gfx.strokePath();

    DEFAULT_SHIP_ROUTE.forEach(([x, y]) => {
      gfx.fillStyle(0xffffff, 0.2);
      gfx.fillCircle(x, y, 4);
    });
  }

  showMessage(x, y, text, color) {
    const msg = this.add.text(x, y - 20, text, {
      fontSize: '16px', color, fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: msg, y: msg.y - 30, alpha: 0, duration: 800,
      onComplete: () => msg.destroy(),
    });
  }

  checkGameOver() {
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
