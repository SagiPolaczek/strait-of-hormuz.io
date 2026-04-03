import Phaser from 'phaser';
import { PROJECTILES } from '../config/units.js';
import { ensureTextures } from '../utils/textures.js';
import { findNearestCoalitionTarget } from '../utils/targeting.js';

export class FastBoat extends Phaser.GameObjects.Container {
  constructor(scene, x, y, variant) {
    super(scene, x, y);
    this.scene = scene;
    this.variant = variant; // 'gun' or 'suicide'
    this.hp = variant === 'gun' ? 50 : 30;
    this.speed = variant === 'gun' ? 150 : 200;
    this.damage = variant === 'gun' ? 8 : 100;
    this.alive = true;
    this.target = null;
    this.lastFired = 0;
    this.fireRate = 800; // gun boats fire every 800ms
    this.orbiting = false;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.orbitRadius = 55 + Math.random() * 15;
    this.isBoat = true;
    this._timers = [];

    ensureTextures(scene);

    // --- Boat hull ---
    this.hullGfx = scene.add.graphics();
    this._drawHull(this.hullGfx);
    this.add(this.hullGfx);

    // --- HP bar (tiny) ---
    this.hpBarBg = scene.add.rectangle(0, -10, 16, 2.5, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-7, -10, 14, 1.5, 0xef5350).setOrigin(0, 0.5);
    this.add([this.hpBarBg, this.hpBar]);

    // --- Wake trail ---
    if (scene.textures.exists('wake')) {
      this.wakeEmitter = scene.add.particles(x, y, 'wake', {
        speed: { min: 3, max: 10 },
        scale: { start: 0.3, end: 0.08 },
        alpha: { start: 0.5, end: 0 },
        lifespan: { min: 200, max: 400 },
        frequency: 50,
        quantity: 1,
        emitting: true,
      });
      this.wakeEmitter.setDepth(2);
    }

    // Suicide boat sparking effect
    if (variant === 'suicide' && scene.textures.exists('flare')) {
      this.sparkEmitter = scene.add.particles(x, y, 'flare', {
        speed: { min: 5, max: 15 },
        scale: { start: 0.25, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 150,
        frequency: 200,
        quantity: 1,
        tint: 0xff4400,
        emitting: true,
      });
      this.sparkEmitter.setDepth(6);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);
    if (this.body) this.body.setCircle(8, -8, -8);
    this.setDepth(5);

    // Self-destruct after 45s to prevent stuck boats from accumulating
    const lifeTimer = scene.time.delayedCall(45000, () => {
      if (this.alive) { this._cleanup(); this.destroy(); }
    });
    this._timers.push(lifeTimer);
  }

  _drawHull(gfx) {
    gfx.clear();
    const isGun = this.variant === 'gun';

    // Tiny aggressive hull
    const hullColor = isGun ? 0x455a64 : 0x8b1a1a;
    gfx.fillStyle(hullColor, 0.95);
    gfx.beginPath();
    gfx.moveTo(10, 0);      // bow
    gfx.lineTo(5, -4);
    gfx.lineTo(-7, -3.5);
    gfx.lineTo(-9, 0);
    gfx.lineTo(-7, 3.5);
    gfx.lineTo(5, 4);
    gfx.closePath();
    gfx.fillPath();

    // Hull outline
    gfx.lineStyle(0.8, isGun ? 0x78909c : 0xff4444, 0.7);
    gfx.beginPath();
    gfx.moveTo(10, 0);
    gfx.lineTo(5, -4);
    gfx.lineTo(-7, -3.5);
    gfx.lineTo(-9, 0);
    gfx.lineTo(-7, 3.5);
    gfx.lineTo(5, 4);
    gfx.closePath();
    gfx.strokePath();

    if (isGun) {
      // Gun turret (small dot + barrel)
      gfx.fillStyle(0x37474f, 1);
      gfx.fillCircle(3, 0, 2);
      gfx.fillRect(3, -0.5, 5, 1);
    } else {
      // Explosive payload glow
      gfx.fillStyle(0xff4400, 0.6);
      gfx.fillCircle(0, 0, 3);
      gfx.fillStyle(0xff0000, 0.9);
      gfx.fillCircle(7, 0, 1.5);
    }
  }

  update() {
    if (!this.alive) return;

    // Find target
    if (!this.target || !this.target.active || !this.target.alive) {
      this.target = this._findTarget();
      this.orbiting = false;
    }
    if (!this.target) return;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.variant === 'suicide') {
      this._updateSuicide(dx, dy, dist);
    } else {
      this._updateGun(dx, dy, dist);
    }

    // Clamp to water — stop if next position would be on land
    if (this.body && this.scene.zoneManager) {
      const nextX = this.x + this.body.velocity.x / 60;
      const nextY = this.y + this.body.velocity.y / 60;
      if (!this.scene.zoneManager.isInWater(nextX, nextY)) {
        this.body.setVelocity(0, 0);
        this.target = null; // re-acquire a reachable target
      }
    }

    // Update wake emitter
    if (this.wakeEmitter?.active) {
      const rad = this.rotation;
      this.wakeEmitter.setPosition(this.x - Math.cos(rad) * 8, this.y - Math.sin(rad) * 8);
    }
    if (this.sparkEmitter?.active) {
      this.sparkEmitter.setPosition(this.x, this.y);
    }
  }

  _updateSuicide(dx, dy, dist) {
    // Charge straight at target
    if (dist < 15) {
      // DETONATE
      this.target.takeDamage(this.damage);
      this._onDetonate();
      return;
    }

    const vx = (dx / dist) * this.speed;
    const vy = (dy / dist) * this.speed;
    if (this.body) this.body.setVelocity(vx, vy);
    this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
  }

  _updateGun(dx, dy, dist) {
    const now = this.scene.time.now;

    if (dist < this.orbitRadius + 10 && !this.orbiting) {
      this.orbiting = true;
      this.orbitAngle = Math.atan2(dy, dx) + Math.PI; // Start opposite
    }

    if (this.orbiting && dist < this.orbitRadius + 40) {
      // Circle the target
      this.orbitAngle += (1.2 / 60); // angular speed
      const ox = this.target.x + Math.cos(this.orbitAngle) * this.orbitRadius;
      const oy = this.target.y + Math.sin(this.orbitAngle) * this.orbitRadius;
      const odx = ox - this.x;
      const ody = oy - this.y;
      const odist = Math.sqrt(odx * odx + ody * ody) || 1;
      const vx = (odx / odist) * this.speed * 0.7;
      const vy = (ody / odist) * this.speed * 0.7;
      if (this.body) this.body.setVelocity(vx, vy);

      // Face target while circling
      this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x) * (180 / Math.PI);

      // Fire at target
      if (now - this.lastFired >= this.fireRate) {
        this.lastFired = now;
        this.scene.fireProjectile(this.x, this.y, this.target, PROJECTILES.FAST_BOAT_BULLET, 'irgc');
      }
    } else {
      // Move toward target
      if (dist > 1) {
        const vx = (dx / dist) * this.speed;
        const vy = (dy / dist) * this.speed;
        if (this.body) this.body.setVelocity(vx, vy);
        this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }
    }
  }

  _findTarget() {
    return findNearestCoalitionTarget(this.scene, this.x, this.y, {
      maxRange: 800,
      includeDefenses: true,
      waterDefensesOnly: true,
    });
  }

  _onDetonate() {
    this.alive = false;
    const wx = this.x, wy = this.y;

    // Water explosion
    if (this.scene.textures.exists('fire')) {
      const fire = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 80, max: 200 }, scale: { start: 1.3, end: 0 },
        lifespan: { min: 300, max: 800 }, quantity: 16, emitting: false,
      });
      fire.setDepth(20); fire.explode(16);
      const sceneRef = this.scene;
      sceneRef.time.delayedCall(1000, () => {
        if (!sceneRef.sys?.isActive()) return;
        if (fire?.active) fire.destroy();
      });
    }

    // Flash + shockwave
    const flash = this.scene.add.circle(wx, wy, 6, 0xffffff, 1).setDepth(21);
    this.scene.tweens.add({
      targets: flash, scaleX: 5, scaleY: 5, alpha: 0,
      duration: 400, onComplete: () => flash.destroy(),
    });

    const ring = this.scene.add.graphics().setDepth(19);
    ring.x = wx; ring.y = wy;
    this.scene.tweens.add({
      targets: ring, alpha: 0, duration: 500,
      onUpdate: (tween) => {
        if (!ring.active) return;
        const r = 8 + tween.progress * 50;
        ring.clear();
        ring.lineStyle(3 - tween.progress * 2.5, 0xff4400, 0.8 - tween.progress * 0.8);
        ring.strokeCircle(0, 0, r);
      },
      onComplete: () => { if (ring.active) ring.destroy(); },
    });

    // Damage text
    const txt = this.scene.add.text(wx, wy - 20, `💥 -${this.damage}`, {
      fontSize: '16px', fontFamily: '"Black Ops One", cursive',
      color: '#ff4444', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({
      targets: txt, y: wy - 55, alpha: 0, duration: 1000,
      onComplete: () => txt.destroy(),
    });

    this._cleanup();
    this.destroy();
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.hp -= amount;
    const maxHp = this.variant === 'gun' ? 50 : 30;
    const pct = Math.max(0, this.hp / maxHp);
    this.hpBar.width = 14 * pct;

    if (this.hullGfx?.active) {
      this.scene.tweens.add({
        targets: this.hullGfx, alpha: { from: 0.3, to: 1 },
        duration: 80, yoyo: true,
      });
    }

    if (this.hp <= 0) {
      this.alive = false;
      this._onDestroyed();
      return true;
    }
    return false;
  }

  _onDestroyed() {
    const wx = this.x, wy = this.y;
    if (this.scene.textures.exists('fire')) {
      const p = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 30, max: 80 }, scale: { start: 0.6, end: 0 },
        lifespan: 400, quantity: 6, emitting: false,
      });
      p.setDepth(20); p.explode(6);
      const sceneRef = this.scene;
      sceneRef.time.delayedCall(600, () => {
        if (!sceneRef.sys?.isActive()) return;
        if (p?.active) p.destroy();
      });
    }
    this._cleanup();
    this.destroy();
  }

  _cleanup() {
    if (this.wakeEmitter?.active) { this.wakeEmitter.stop(); this.wakeEmitter.destroy(); }
    this.wakeEmitter = null;
    if (this.sparkEmitter?.active) { this.sparkEmitter.stop(); this.sparkEmitter.destroy(); }
    this.sparkEmitter = null;
  }

  destroy(fromScene) {
    this._timers.forEach(t => { if (t) t.remove(false); });
    this._timers = [];
    this._cleanup();
    super.destroy(fromScene);
  }
}
