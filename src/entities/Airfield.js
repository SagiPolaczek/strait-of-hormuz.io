import Phaser from 'phaser';
import { F22 } from './F22.js';
import { getMaxHP as calcMaxHP } from '../utils/calculations.js';

export class Airfield extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.upgrades = {};
    this.f22 = null;
    this._timers = [];

    // --- Runway base ---
    this.baseGfx = scene.add.graphics();
    this._drawBase(this.baseGfx);
    this.add(this.baseGfx);

    // --- Radar dish (rotates) ---
    this.radarGfx = scene.add.graphics();
    this.radarGfx.fillStyle(0x2196f3, 0.8);
    this.radarGfx.fillCircle(0, 0, 2);
    this.radarGfx.lineStyle(1.5, 0x42a5f5, 0.8);
    this.radarGfx.lineBetween(0, 0, 8, 0);
    this.radarGfx.x = -20;
    this.radarGfx.y = -14;
    this.add(this.radarGfx);

    scene.tweens.add({
      targets: this.radarGfx, angle: 360,
      duration: 2500, repeat: -1, ease: 'Linear',
    });

    // --- HP bar ---
    this.hpBarBg = scene.add.rectangle(0, -38, 60, 5, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-28, -38, 56, 3, 0x4caf50).setOrigin(0, 0.5);
    this.add([this.hpBarBg, this.hpBar]);

    // --- Refuel gauge (below HP bar) ---
    this.fuelBarBg = scene.add.rectangle(0, -32, 60, 3, 0x000000, 0.3).setOrigin(0.5);
    this.fuelBar = scene.add.rectangle(-28, -32, 0, 2, 0xffab40).setOrigin(0, 0.5);
    this.add([this.fuelBarBg, this.fuelBar]);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    if (this.body) this.body.setCircle(38, -38, -38);
    this.setDepth(4);

    // Spawn F-22 after brief delay
    const t = scene.time.delayedCall(2000, () => {
      if (!this.scene || !this.scene.sys?.isActive()) return;
      this._spawnF22();
    });
    this._timers.push(t);
  }

  _drawBase(gfx) {
    gfx.clear();

    // Runway (long rectangle)
    gfx.fillStyle(0x37474f, 0.9);
    gfx.fillRect(-55, -18, 110, 36);
    gfx.lineStyle(1.5, 0x546e7a, 0.7);
    gfx.strokeRect(-55, -18, 110, 36);

    // Runway center line (dashed)
    gfx.lineStyle(2, 0xffffff, 0.4);
    for (let i = -49; i < 49; i += 10) {
      gfx.lineBetween(i, 0, i + 5, 0);
    }

    // Runway threshold markings
    gfx.lineStyle(1.5, 0xffffff, 0.3);
    gfx.lineBetween(-51, -12, -51, 12);
    gfx.lineBetween(51, -12, 51, 12);

    // Taxiway edge lights (small yellow dots)
    gfx.fillStyle(0xffeb3b, 0.5);
    for (let i = -49; i <= 49; i += 8) {
      gfx.fillCircle(i, -18, 1.5);
      gfx.fillCircle(i, 18, 1.5);
    }

    // Control tower
    gfx.fillStyle(0x455a64, 0.9);
    gfx.fillRect(-45, -30, 10, 14);
    gfx.lineStyle(1, 0x78909c, 0.6);
    gfx.strokeRect(-45, -30, 10, 14);

    // Tower windows
    gfx.fillStyle(0xb3e5fc, 0.7);
    gfx.fillRect(-43, -28, 3, 3);
    gfx.fillRect(-39, -28, 3, 3);

    // Blue coalition accent stripe
    gfx.fillStyle(0x2196f3, 0.4);
    gfx.fillRect(-55, -18, 110, 3);
    gfx.fillRect(-55, 15, 110, 3);

    // Hangar area
    gfx.fillStyle(0x263238, 0.8);
    gfx.fillRect(33, -30, 16, 14);
    gfx.lineStyle(1, 0x37474f, 0.6);
    gfx.strokeRect(33, -30, 16, 14);

    // Hangar door lines
    gfx.lineStyle(0.8, 0x455a64, 0.5);
    gfx.lineBetween(41, -30, 41, -16);
  }

  getMaxHP() {
    return calcMaxHP(this.stats.hp, 0, this.upgrades.ARMOR || 0);
  }

  applyUpgrade(key) {
    const prevMax = this.getMaxHP();
    this.upgrades[key] = (this.upgrades[key] || 0) + 1;
    const newMax = this.getMaxHP();
    if (newMax > prevMax) this.hp += (newMax - prevMax);
  }

  _spawnF22() {
    if (!this.scene || !this.active) return;
    this.f22 = new F22(this.scene, this.x, this.y, this);
    if (this.scene.coalitionAir) this.scene.coalitionAir.add(this.f22);
  }

  update() {
    // Update fuel bar to show F-22 refuel state
    if (this.f22 && this.f22.active && this.f22.state === 'REFUELING') {
      const pct = this.f22.getRefuelProgress();
      this.fuelBar.width = 56 * pct;
    } else if (this.f22 && this.f22.active && this.f22.state === 'GROUNDED') {
      this.fuelBar.width = 0;
    } else {
      this.fuelBar.width = 40; // full when in flight
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.getMaxHP());
    this.hpBar.width = 56 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    if (this.baseGfx?.active) {
      this.scene.tweens.add({
        targets: this.baseGfx, alpha: { from: 0.3, to: 1 },
        duration: 100, yoyo: true, repeat: 1,
      });
    }

    if (this.hp <= 0) {
      this._onDestroyed();
      this.destroy();
      return true;
    }
    return false;
  }

  _onDestroyed() {
    if (!this.scene) return;
    const wx = this.x, wy = this.y;

    // Kill the F-22 if it exists
    if (this.f22 && this.f22.active) {
      this.f22.onAirfieldDestroyed();
    }

    // Explosion
    if (this.scene.textures.exists('fire')) {
      const fire = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 60, max: 180 }, scale: { start: 1.2, end: 0 },
        lifespan: { min: 400, max: 1000 }, quantity: 18, emitting: false,
      });
      fire.setDepth(20); fire.explode(18);
      this.scene.time.delayedCall(1200, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (fire?.active) fire.destroy();
      });
    }

    const flash = this.scene.add.circle(wx, wy, 8, 0xffffff, 1).setDepth(21);
    this.scene.tweens.add({
      targets: flash, scaleX: 5, scaleY: 5, alpha: 0,
      duration: 400, onComplete: () => flash.destroy(),
    });

    const txt = this.scene.add.text(wx, wy - 20, '💥 AIRFIELD LOST', {
      fontSize: '16px', fontFamily: '"Black Ops One", cursive',
      color: '#ff4444', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({
      targets: txt, y: wy - 50, alpha: 0, duration: 1200,
      onComplete: () => txt.destroy(),
    });
  }

  destroy(fromScene) {
    this._timers.forEach(t => { if (t) t.remove(false); });
    this._timers = [];
    if (this.radarGfx) this.scene?.tweens?.killTweensOf(this.radarGfx);
    super.destroy(fromScene);
  }
}
