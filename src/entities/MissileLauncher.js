import Phaser from 'phaser';
import { PROJECTILES } from '../config/units.js';
import { ensureTextures } from '../utils/textures.js';

export class MissileLauncher extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.lastFired = 0;
    this._timers = [];
    this._frameCount = 0;

    ensureTextures(scene);

    // --- Base platform (truck body sprite) ---
    this.bodySprite = scene.add.image(0, 0, 'spr_missile_launcher_body').setOrigin(0.5);
    this.add(this.bodySprite);

    // --- Range circle with animated dashed line ---
    this.rangeGfx = scene.add.graphics();
    this._dashOffset = 0;
    this._drawRangeCircle();
    this.add(this.rangeGfx);

    // Red warning glow (pulsing) — draw once, animate alpha
    this.warningGlow = scene.add.graphics();
    this.warningGlow.fillStyle(0xf44336, 0.25);
    this.warningGlow.fillCircle(0, 0, 22);
    this.add(this.warningGlow);

    scene.tweens.add({
      targets: this.warningGlow,
      alpha: { from: 0.05, to: 0.25 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // --- Launcher rail (rotates toward target) ---
    this.railSprite = scene.add.image(4, -4, 'spr_missile_launcher_rail').setOrigin(0.1, 0.5);
    this.add(this.railSprite);

    // --- HP bar ---
    this.hpBarBg = scene.add.rectangle(0, -30, 40, 5, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-18, -30, 36, 3, 0x4caf50).setOrigin(0, 0.5);
    this.hpBarBorder = scene.add.graphics();
    this.hpBarBorder.lineStyle(0.8, 0xffffff, 0.4);
    this.hpBarBorder.strokeRect(-20, -32, 40, 5);
    this.add([this.hpBarBg, this.hpBar, this.hpBarBorder]);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    if (this.body) this.body.setCircle(20, -20, -20);
    this.setDepth(4);
  }

  _drawRangeCircle() {
    if (!this.rangeGfx || !this.rangeGfx.active) return;
    this.rangeGfx.clear();

    const r = this.stats.range;
    const dashLen = 12;
    const gapLen = 8;
    const circumference = 2 * Math.PI * r;
    const totalSegments = Math.floor(circumference / (dashLen + gapLen));
    const segAngle = (2 * Math.PI) / totalSegments;

    this.rangeGfx.lineStyle(1.2, 0xf44336, 0.18);

    for (let i = 0; i < totalSegments; i++) {
      const startAngle = i * segAngle + this._dashOffset;
      const endAngle = startAngle + segAngle * (dashLen / (dashLen + gapLen));

      this.rangeGfx.beginPath();
      this.rangeGfx.arc(0, 0, r, startAngle, endAngle, false);
      this.rangeGfx.strokePath();
    }
  }

  update() {
    const now = this.scene.time.now;

    // Throttle range circle redraw to every 5th frame
    this._frameCount++;
    if (this._frameCount % 5 === 0) {
      this._dashOffset += 0.015;
      if (this._dashOffset > Math.PI * 2) this._dashOffset -= Math.PI * 2;
      this._drawRangeCircle();
    }

    // Find target and rotate launcher toward it
    const target = this.findNearestShip();
    if (target && this.railSprite && this.railSprite.active) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.railSprite.angle = angle - this.angle;
    }

    if (now - this.lastFired < this.stats.fireRate) return;

    if (target) {
      this.lastFired = now;
      this._fireMuzzleFlash(target);
      this.scene.fireProjectile(this.x, this.y, target, PROJECTILES.MISSILE, 'irgc');
    }
  }

  _fireMuzzleFlash(target) {
    if (!this.scene) return;

    // Calculate muzzle position (end of launcher barrel in world space)
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist;
    const dirY = dy / dist;
    const muzzleX = this.x + dirX * 20;
    const muzzleY = this.y + dirY * 20;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Dramatic muzzle flash
    const flash = this.scene.add.circle(muzzleX, muzzleY, 6, 0xff6600, 1).setDepth(12);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    // Inner white flash
    const innerFlash = this.scene.add.circle(muzzleX, muzzleY, 3, 0xffffff, 1).setDepth(13);
    this.scene.tweens.add({
      targets: innerFlash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 120,
      onComplete: () => innerFlash.destroy(),
    });

    // Smoke puff at launch point
    if (this.scene.textures.exists('smoke')) {
      const smoke = this.scene.add.particles(muzzleX, muzzleY, 'smoke', {
        speed: { min: 15, max: 50 },
        angle: { min: angle - 60, max: angle + 60 },
        scale: { start: 0.6, end: 0.15 },
        alpha: { start: 0.6, end: 0 },
        lifespan: { min: 300, max: 600 },
        quantity: 5,
        emitting: false,
      });
      smoke.setDepth(11);
      smoke.explode(5);
      this.scene.time.delayedCall(700, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (smoke && smoke.active) smoke.destroy();
      });
    }

    // Fire sparks in firing direction
    if (this.scene.textures.exists('flare')) {
      const sparks = this.scene.add.particles(muzzleX, muzzleY, 'flare', {
        speed: { min: 40, max: 100 },
        angle: { min: angle - 30, max: angle + 30 },
        scale: { start: 0.5, end: 0 },
        lifespan: 200,
        tint: 0xff4400,
        quantity: 5,
        emitting: false,
      });
      sparks.setDepth(12);
      sparks.explode(5);
      this.scene.time.delayedCall(400, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (sparks && sparks.active) sparks.destroy();
      });
    }

    // Shake the launcher slightly on fire
    if (this.bodySprite && this.bodySprite.active) {
      this.scene.tweens.add({
        targets: this,
        x: this.x + dirX * -2,
        y: this.y + dirY * -2,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }
  }

  findNearestShip() {
    const ships = this.scene.coalitionShips?.getChildren() || [];
    let nearest = null;
    let nearestDist = this.stats.range;

    for (const ship of ships) {
      if (!ship.active || !ship.alive || ship.isSubmerged) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, ship.x, ship.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = ship;
      }
    }
    return nearest;
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 36 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    // Flash on damage
    if (this.bodySprite && this.bodySprite.active) {
      this.scene.tweens.add({
        targets: this.bodySprite,
        alpha: { from: 0.3, to: 1 },
        duration: 100,
        yoyo: true,
        repeat: 1,
      });
    }

    // Damage sparks
    if (this.scene && this.scene.textures.exists('flare')) {
      const sparks = this.scene.add.particles(this.x, this.y, 'flare', {
        speed: { min: 20, max: 60 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 200,
        tint: 0xffcc00,
        quantity: 3,
        emitting: false,
      });
      sparks.setDepth(12);
      sparks.explode(3);
      this.scene.time.delayedCall(400, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (sparks && sparks.active) sparks.destroy();
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
    const wx = this.x;
    const wy = this.y;

    // Spectacular explosion - fire burst
    const fire = this.scene.add.particles(wx, wy, 'fire', {
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: { min: 400, max: 1000 },
      quantity: 18,
      emitting: false,
    });
    fire.setDepth(20);
    fire.explode(18);

    // Heavy smoke cloud
    const smoke = this.scene.add.particles(wx, wy, 'smoke', {
      speed: { min: 15, max: 70 },
      angle: { min: 220, max: 320 },
      scale: { start: 2, end: 0.4 },
      lifespan: { min: 800, max: 2000 },
      quantity: 12,
      emitting: false,
    });
    smoke.setDepth(19);
    smoke.explode(12);

    // Debris flying outward
    const debris = this.scene.add.particles(wx, wy, 'debris', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0.3 },
      lifespan: { min: 500, max: 1500 },
      gravityY: 120,
      quantity: 10,
      rotate: { min: 0, max: 360 },
      emitting: false,
    });
    debris.setDepth(20);
    debris.explode(10);

    // Big explosion flash
    const flash = this.scene.add.circle(wx, wy, 8, 0xffffff, 1).setDepth(22);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Secondary red flash ring
    const ring = this.scene.add.circle(wx, wy, 10, 0xff4400, 0.7).setDepth(21);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 500,
      delay: 50,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Cleanup
    const sceneRef = this.scene;
    sceneRef.time.delayedCall(2200, () => {
      if (!sceneRef.sys?.isActive()) return;
      if (fire && fire.active) fire.destroy();
      if (smoke && smoke.active) smoke.destroy();
      if (debris && debris.active) debris.destroy();
    });
  }

  destroy(fromScene) {
    this._timers?.forEach(t => { if (t) t.remove(false); });
    this._timers = [];
    super.destroy(fromScene);
  }
}
