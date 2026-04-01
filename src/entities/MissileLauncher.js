import Phaser from 'phaser';
import { PROJECTILES } from '../config/units.js';

// Ensure shared particle textures exist
function ensureTextures(scene) {
  if (!scene.textures.exists('flare')) {
    const c = scene.textures.createCanvas('flare', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!scene.textures.exists('smoke')) {
    const c = scene.textures.createCanvas('smoke', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(120,120,120,0.8)');
    g.addColorStop(0.5, 'rgba(80,80,80,0.4)');
    g.addColorStop(1, 'rgba(40,40,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!scene.textures.exists('fire')) {
    const c = scene.textures.createCanvas('fire', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,200,50,1)');
    g.addColorStop(0.4, 'rgba(255,100,20,0.8)');
    g.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!scene.textures.exists('debris')) {
    const c = scene.textures.createCanvas('debris', 6, 6);
    const ctx = c.getContext();
    ctx.fillStyle = '#555555';
    ctx.fillRect(1, 1, 4, 4);
    c.refresh();
  }
}

export class MissileLauncher extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.lastFired = 0;

    ensureTextures(scene);

    // --- Base platform (hexagonal fortification) ---
    this.baseGfx = scene.add.graphics();
    this._drawBase(this.baseGfx);
    this.add(this.baseGfx);

    // --- Range circle with animated dashed line ---
    this.rangeGfx = scene.add.graphics();
    this._dashOffset = 0;
    this._drawRangeCircle();
    this.add(this.rangeGfx);

    // Red warning glow (pulsing)
    this.warningGlow = scene.add.graphics();
    this.warningGlowAlpha = 0.15;
    this._drawWarningGlow();

    scene.tweens.add({
      targets: this,
      warningGlowAlpha: { from: 0.05, to: 0.25 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => this._drawWarningGlow(),
    });
    this.add(this.warningGlow);

    // --- Launcher barrel (rotates toward target) ---
    this.launcherGfx = scene.add.graphics();
    this._drawLauncher(this.launcherGfx);
    this.add(this.launcherGfx);

    // --- HP bar ---
    this.hpBarBg = scene.add.rectangle(0, -28, 36, 5, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-16, -28, 32, 3, 0x4caf50).setOrigin(0, 0.5);
    this.hpBarBorder = scene.add.graphics();
    this.hpBarBorder.lineStyle(0.8, 0xffffff, 0.4);
    this.hpBarBorder.strokeRect(-18, -30, 36, 5);
    this.add([this.hpBarBg, this.hpBar, this.hpBarBorder]);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    if (this.body) this.body.setCircle(18, -18, -18);
    this.setDepth(4);
  }

  _drawBase(gfx) {
    gfx.clear();

    // Hexagonal base platform
    const r = 16;
    gfx.fillStyle(0x4a1a1a, 0.85);
    gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) gfx.moveTo(px, py);
      else gfx.lineTo(px, py);
    }
    gfx.closePath();
    gfx.fillPath();

    // Hexagon border
    gfx.lineStyle(1.5, 0xf44336, 0.6);
    gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) gfx.moveTo(px, py);
      else gfx.lineTo(px, py);
    }
    gfx.closePath();
    gfx.strokePath();

    // Inner details (sandbag circles at corners)
    gfx.fillStyle(0x5d4037, 0.5);
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = Math.cos(angle) * (r - 3);
      const py = Math.sin(angle) * (r - 3);
      gfx.fillCircle(px, py, 2.5);
    }

    // Center pad
    gfx.fillStyle(0x333333, 0.8);
    gfx.fillCircle(0, 0, 6);
    gfx.lineStyle(0.8, 0xf44336, 0.4);
    gfx.strokeCircle(0, 0, 6);
  }

  _drawLauncher(gfx) {
    gfx.clear();
    // Launcher tube
    gfx.fillStyle(0x5d4037, 0.9);
    gfx.fillRect(0, -2.5, 14, 5);
    // Tube opening
    gfx.fillStyle(0x333333, 1);
    gfx.fillCircle(14, 0, 2.5);
    // Tube end cap
    gfx.fillStyle(0x4e342e, 0.9);
    gfx.fillRect(-2, -3.5, 4, 7);
    // Cross-hatch detail
    gfx.lineStyle(0.5, 0xf44336, 0.3);
    gfx.lineBetween(2, -2, 12, -2);
    gfx.lineBetween(2, 2, 12, 2);
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

  _drawWarningGlow() {
    if (!this.warningGlow || !this.warningGlow.active) return;
    this.warningGlow.clear();
    this.warningGlow.fillStyle(0xf44336, this.warningGlowAlpha);
    this.warningGlow.fillCircle(0, 0, 22);
  }

  update() {
    const now = this.scene.time.now;

    // Slowly rotate the dashed range circle
    this._dashOffset += 0.003;
    if (this._dashOffset > Math.PI * 2) this._dashOffset -= Math.PI * 2;
    this._drawRangeCircle();

    // Find target and rotate launcher toward it
    const target = this.findNearestShip();
    if (target && this.launcherGfx && this.launcherGfx.active) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.launcherGfx.angle = angle;
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
    const muzzleX = this.x + dirX * 16;
    const muzzleY = this.y + dirY * 16;

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
      this.scene.time.delayedCall(700, () => { if (smoke && smoke.active) smoke.destroy(); });
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
      this.scene.time.delayedCall(400, () => { if (sparks && sparks.active) sparks.destroy(); });
    }

    // Shake the launcher slightly on fire
    if (this.baseGfx && this.baseGfx.active) {
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
      if (!ship.active || !ship.alive) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, ship.x, ship.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = ship;
      }
    }
    return nearest;
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 32 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    // Flash on damage
    if (this.baseGfx && this.baseGfx.active) {
      this.scene.tweens.add({
        targets: this.baseGfx,
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
      this.scene.time.delayedCall(400, () => { if (sparks && sparks.active) sparks.destroy(); });
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
    this.scene.time.delayedCall(2200, () => {
      if (fire && fire.active) fire.destroy();
      if (smoke && smoke.active) smoke.destroy();
      if (debris && debris.active) debris.destroy();
    });
  }
}
