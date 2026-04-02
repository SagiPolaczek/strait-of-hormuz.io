import Phaser from 'phaser';
import { PROJECTILES } from '../config/units.js';
import { ensureTextures } from '../utils/textures.js';

export class MiniSubmarine extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.scene = scene;
    this.hp = 80;
    this.torpedoDamage = 100;
    this.speed = 70;
    this.surfaceSpeed = 40;
    this.alive = true;
    this.submerged = true;
    this.detected = false; // revealed by coalition sonar
    this.target = null;
    this.surfaceTimer = 0;
    this.diveTimer = 0;
    this.surfaceDuration = 4000;  // 4s surfaced
    this.diveCooldown = 12000;    // 12s between surfaces
    this.lastDive = -this.diveCooldown; // can surface immediately
    this.hasFiredThisSurface = false;
    this.isSub = true;
    this._timers = [];

    ensureTextures(scene);

    // --- Periscope wake (visible when submerged — subtle) ---
    this.periscopeGfx = scene.add.graphics();
    this._drawPeriscope(this.periscopeGfx);
    this.add(this.periscopeGfx);
    this.periscopeGfx.setAlpha(0.2); // very subtle

    // --- Full submarine body (visible when surfaced or detected) ---
    this.bodyGfx = scene.add.graphics();
    this._drawSubBody(this.bodyGfx);
    this.add(this.bodyGfx);
    this.bodyGfx.setAlpha(0); // hidden initially

    // --- Sonar detection outline (shown when detected by sonar) ---
    this.sonarOutline = scene.add.graphics();
    this.sonarOutline.lineStyle(2, 0xff4444, 0.6);
    this.sonarOutline.strokeEllipse(0, 0, 28, 12);
    this.add(this.sonarOutline);
    this.sonarOutline.setAlpha(0);

    // --- HP bar (only visible when surfaced/detected) ---
    this.hpBarBg = scene.add.rectangle(0, -14, 28, 3, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-12, -14, 24, 2, 0xef5350).setOrigin(0, 0.5);
    this.add([this.hpBarBg, this.hpBar]);
    this.hpBarBg.setAlpha(0);
    this.hpBar.setAlpha(0);

    // Bubble trail (subtle when submerged)
    if (scene.textures.exists('wake')) {
      this.bubbleTrail = scene.add.particles(x, y, 'wake', {
        speed: { min: 3, max: 8 },
        scale: { start: 0.15, end: 0.03 },
        alpha: { start: 0.3, end: 0 },
        lifespan: 400,
        frequency: 150,
        quantity: 1,
        emitting: true,
      });
      this.bubbleTrail.setDepth(2);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);
    if (this.body) this.body.setCircle(10, -10, -10);
    this.setDepth(3);
  }

  _drawPeriscope(gfx) {
    gfx.clear();
    // Small vertical line (periscope mast)
    gfx.lineStyle(1, 0x555555, 0.6);
    gfx.lineBetween(6, -3, 6, 0);
    // Periscope head
    gfx.fillStyle(0x444444, 0.7);
    gfx.fillCircle(6, -3, 1.5);
    // V-wake behind periscope
    gfx.lineStyle(0.8, 0xffffff, 0.2);
    gfx.lineBetween(4, 1, -2, 4);
    gfx.lineBetween(4, -1, -2, -4);
  }

  _drawSubBody(gfx) {
    gfx.clear();

    // Submarine hull (elongated oval)
    gfx.fillStyle(0x3d3d3d, 0.9);
    gfx.beginPath();
    gfx.moveTo(12, 0);      // bow
    gfx.lineTo(8, -4);
    gfx.lineTo(-8, -4);
    gfx.lineTo(-12, -2);
    gfx.lineTo(-12, 2);
    gfx.lineTo(-8, 4);
    gfx.lineTo(8, 4);
    gfx.closePath();
    gfx.fillPath();

    // Hull outline (red IRGC accent)
    gfx.lineStyle(1, 0xf44336, 0.6);
    gfx.beginPath();
    gfx.moveTo(12, 0);
    gfx.lineTo(8, -4);
    gfx.lineTo(-8, -4);
    gfx.lineTo(-12, -2);
    gfx.lineTo(-12, 2);
    gfx.lineTo(-8, 4);
    gfx.lineTo(8, 4);
    gfx.closePath();
    gfx.strokePath();

    // Conning tower
    gfx.fillStyle(0x4a4a4a, 0.9);
    gfx.fillRect(-2, -7, 6, 4);
    gfx.lineStyle(0.8, 0xf44336, 0.4);
    gfx.strokeRect(-2, -7, 6, 4);

    // Periscope mast
    gfx.lineStyle(1, 0x555555, 0.7);
    gfx.lineBetween(1, -7, 1, -10);

    // Torpedo tube (front)
    gfx.fillStyle(0x222222, 1);
    gfx.fillCircle(11, 0, 1.5);

    // Propeller (rear)
    gfx.fillStyle(0x555555, 0.8);
    gfx.fillCircle(-11, 0, 2);
    gfx.lineStyle(0.8, 0x666666, 0.6);
    gfx.lineBetween(-11, -3, -11, 3);
  }

  update() {
    if (!this.alive) return;
    const now = this.scene.time.now;

    // Find target
    if (!this.target || !this.target.active || !this.target.alive) {
      this.target = this._findTarget();
    }

    // Movement
    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const spd = this.submerged ? this.speed : this.surfaceSpeed;

      if (dist > 30) {
        const vx = (dx / dist) * spd;
        const vy = (dy / dist) * spd;
        if (this.body) this.body.setVelocity(vx, vy);
        this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
      } else {
        if (this.body) this.body.setVelocity(0, 0);
      }

      // Surface to fire if close enough and cooldown ready
      if (this.submerged && dist < 250 && now - this.lastDive >= this.diveCooldown) {
        this._surface();
      }
    } else {
      // Patrol: drift slowly, but stay in water
      const nextX = this.x + this.speed * 0.3 / 60;
      if (this.scene.zoneManager && !this.scene.zoneManager.isInWater(nextX, this.y)) {
        if (this.body) this.body.setVelocity(-this.speed * 0.3, 0);
      } else {
        if (this.body) this.body.setVelocity(this.speed * 0.3, 0);
      }
    }

    // Surface timer — dive back down after surfaceDuration
    if (!this.submerged && this.surfaceTimer > 0) {
      if (now >= this.surfaceTimer) {
        this._dive();
      } else if (!this.hasFiredThisSurface && this.target?.active) {
        // Fire torpedo while surfaced
        this.hasFiredThisSurface = true;
        this._fireTorpedo();
      }
    }

    // Update visibility
    this._updateVisibility();

    // Update bubble trail
    if (this.bubbleTrail?.active) {
      const rad = this.rotation;
      this.bubbleTrail.setPosition(this.x - Math.cos(rad) * 10, this.y - Math.sin(rad) * 10);
    }
  }

  _surface() {
    this.submerged = false;
    this.surfaceTimer = this.scene.time.now + this.surfaceDuration;
    this.hasFiredThisSurface = false;

    // Surface splash visual
    const splash = this.scene.add.circle(this.x, this.y, 5, 0x64b5f6, 0.6).setDepth(6);
    this.scene.tweens.add({
      targets: splash, scaleX: 4, scaleY: 4, alpha: 0,
      duration: 500, onComplete: () => splash.destroy(),
    });
  }

  _dive() {
    this.submerged = true;
    this.surfaceTimer = 0;
    this.lastDive = this.scene.time.now;

    // Dive splash
    const splash = this.scene.add.circle(this.x, this.y, 3, 0x64b5f6, 0.4).setDepth(6);
    this.scene.tweens.add({
      targets: splash, scaleX: 3, scaleY: 3, alpha: 0,
      duration: 400, onComplete: () => splash.destroy(),
    });
  }

  _fireTorpedo() {
    if (!this.target?.active) return;

    // Fire torpedo projectile
    this.scene.fireProjectile(this.x, this.y, this.target,
      { ...PROJECTILES.TORPEDO, damage: this.torpedoDamage }, 'irgc');

    // Launch flash
    const flash = this.scene.add.circle(this.x + 10, this.y, 3, 0x00bcd4, 0.8).setDepth(12);
    this.scene.tweens.add({
      targets: flash, scaleX: 2, scaleY: 2, alpha: 0,
      duration: 200, onComplete: () => flash.destroy(),
    });
  }

  _updateVisibility() {
    const visible = !this.submerged || this.detected;
    const bodyAlpha = !this.submerged ? 1 : (this.detected ? 0.5 : 0);
    const periscopeAlpha = this.submerged ? 0.25 : 0;
    const sonarAlpha = this.submerged && this.detected ? 0.6 : 0;
    const hpAlpha = visible ? 1 : 0;

    this.bodyGfx.setAlpha(bodyAlpha);
    this.periscopeGfx.setAlpha(periscopeAlpha);
    this.sonarOutline.setAlpha(sonarAlpha);
    this.hpBarBg.setAlpha(hpAlpha);
    this.hpBar.setAlpha(hpAlpha);
  }

  _findTarget() {
    let nearest = null, nearDist = Infinity;
    for (const s of this.scene.coalitionShips?.getChildren() || []) {
      if (!s.active || !s.alive || s.isSubmerged) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, s.x, s.y);
      if (d < nearDist) { nearDist = d; nearest = s; }
    }
    for (const r of this.scene.coalitionRigs?.getChildren() || []) {
      if (!r.active || r.side !== 'coalition') continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, r.x, r.y);
      if (d < nearDist) { nearDist = d; nearest = r; }
    }
    return nearest;
  }

  takeDamage(amount) {
    if (!this.active) return false;
    // Can only take damage when surfaced or detected
    if (this.submerged && !this.detected) return false;

    this.hp -= amount;
    const pct = Math.max(0, this.hp / 80);
    this.hpBar.width = 24 * pct;

    if (this.bodyGfx?.active) {
      this.scene.tweens.add({
        targets: this.bodyGfx, alpha: { from: 0.3, to: this.submerged ? 0.5 : 1 },
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
        speed: { min: 40, max: 120 }, scale: { start: 0.9, end: 0 },
        lifespan: 600, quantity: 10, emitting: false,
      });
      p.setDepth(20); p.explode(10);
      const sceneRef = this.scene;
      sceneRef.time.delayedCall(800, () => {
        if (!sceneRef.sys?.isActive()) return;
        if (p?.active) p.destroy();
      });
    }

    // Water column
    const ring = this.scene.add.graphics().setDepth(19);
    ring.x = wx; ring.y = wy;
    this.scene.tweens.add({
      targets: ring, alpha: 0, duration: 500,
      onUpdate: (tween) => {
        if (!ring.active) return;
        const r = 6 + tween.progress * 40;
        ring.clear();
        ring.lineStyle(2.5 - tween.progress * 2, 0x64b5f6, 0.7 - tween.progress * 0.7);
        ring.strokeCircle(0, 0, r);
      },
      onComplete: () => { if (ring.active) ring.destroy(); },
    });

    const txt = this.scene.add.text(wx, wy - 15, '✓ SUB DESTROYED', {
      fontSize: '12px', fontFamily: '"Share Tech Mono", monospace',
      color: '#4CAF50', fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({
      targets: txt, y: wy - 40, alpha: 0, duration: 800,
      onComplete: () => txt.destroy(),
    });

    this._cleanup();
    this.destroy();
  }

  _cleanup() {
    if (this.bubbleTrail?.active) { this.bubbleTrail.stop(); this.bubbleTrail.destroy(); }
    this.bubbleTrail = null;
  }

  destroy(fromScene) {
    this._timers.forEach(t => { if (t) t.remove(false); });
    this._timers = [];
    this._cleanup();
    super.destroy(fromScene);
  }
}
