import Phaser from 'phaser';
import { PROJECTILES } from '../config/units.js';
import { getEffectiveRange as calcRange, getEffectiveFireRate as calcFireRate } from '../utils/calculations.js';

export class AirDefense extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.lastFired = 0;
    this.upgrades = { RANGE: 0, FIRE_RATE: 0 };

    // Base sprite
    this.baseSprite = scene.add.image(0, 0, 'spr_air_defense_base').setOrigin(0.5);
    this.add(this.baseSprite);

    // Gun sprite (replaces rotating radar dish)
    this.gunSprite = scene.add.image(0, -6, 'spr_air_defense_gun').setOrigin(0.5, 0.7);
    this.add(this.gunSprite);

    // Range circle
    this.rangeGfx = scene.add.graphics();
    this.rangeGfx.lineStyle(1, 0x2196f3, 0.1);
    this.rangeGfx.strokeCircle(0, 0, stats.range);
    this.add(this.rangeGfx);

    // HP bar
    this.hpBarBg = scene.add.rectangle(0, -38, 44, 5, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-20, -38, 40, 3, 0x4caf50).setOrigin(0, 0.5);
    this.add([this.hpBarBg, this.hpBar]);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    if (this.body) this.body.setCircle(42, -42, -42);
    this.setDepth(4);
  }

  getMaxHP() { return this.stats.hp; }

  applyUpgrade(key) {
    this.upgrades[key] = (this.upgrades[key] || 0) + 1;
    if (key === 'RANGE') {
      this.rangeGfx.clear();
      this.rangeGfx.lineStyle(1, 0x2196f3, 0.1);
      this.rangeGfx.strokeCircle(0, 0, this.getEffectiveRange());
    }
  }

  getEffectiveRange() {
    return calcRange(this.stats.range, this.upgrades.RANGE || 0);
  }

  getEffectiveFireRate() {
    return calcFireRate(this.stats.fireRate, this.upgrades.FIRE_RATE || 0);
  }

  update() {
    if (!this.active || this.hp <= 0) return;

    const target = this._findAirTarget();

    // Continuous aiming — rotate gun even when not firing
    if (target && this.gunSprite) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      this.gunSprite.rotation = (angle + Math.PI / 2) - this.rotation;
    }

    // Fire rate gated (use scene clock, not Date.now())
    const now = this.scene.time.now;
    if (now - this.lastFired < this.getEffectiveFireRate()) return;
    if (!target) return;

    this.lastFired = now;

    // Fire interceptor
    this.scene.fireProjectile(this.x, this.y, target, PROJECTILES.INTERCEPTOR, 'coalition');

    // Muzzle flash
    const flash = this.scene.add.circle(this.x, this.y - 14, 4, 0x00e5ff, 0.8).setDepth(12);
    this.scene.tweens.add({
      targets: flash, scaleX: 2.5, scaleY: 2.5, alpha: 0,
      duration: 200, onComplete: () => flash.destroy(),
    });
  }

  _findAirTarget() {
    const airTargets = this.scene.irgcAir?.getChildren() || [];
    let nearest = null, nearDist = this.getEffectiveRange();

    for (const t of airTargets) {
      if (!t.active || !t.alive) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
      if (dist < nearDist) { nearDist = dist; nearest = t; }
    }
    return nearest;
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 40 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    if (this.baseSprite?.active) {
      this.scene.tweens.add({
        targets: this.baseSprite, alpha: { from: 0.3, to: 1 },
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
    if (this.scene.textures.exists('fire')) {
      const fire = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 50, max: 150 }, scale: { start: 1, end: 0 },
        lifespan: 700, quantity: 12, emitting: false,
      });
      fire.setDepth(20); fire.explode(12);
      this.scene.time.delayedCall(900, () => { if (fire?.active) fire.destroy(); });
    }
    const flash = this.scene.add.circle(wx, wy, 6, 0xffffff, 1).setDepth(21);
    this.scene.tweens.add({
      targets: flash, scaleX: 4, scaleY: 4, alpha: 0,
      duration: 350, onComplete: () => flash.destroy(),
    });
  }
}
