import Phaser from 'phaser';
import { Ship } from './Ship.js';
import { PROJECTILES } from '../config/units.js';

export class CoalitionSubmarine extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, { ...stats, _spriteKey: 'spr_submarine' });
    this.isSubmerged = true; // immune to IRGC surface weapons
    this.lastFired = 0;
    this.sonarPulseTime = 0;
    this.sonarRange = stats.sonarRange || 300;
    this.upgrades = {};

    // Force depth below surface ships (Ship constructor sets 5)
    super.setDepth(3);

    // --- Override visual: periscope trail instead of wake ---
    if (this.wakeEmitter?.active) {
      this.wakeEmitter.destroy();
      this.wakeEmitter = null;
    }

    // Periscope wake (subtle V-shape trail)
    if (scene.textures.exists('wake')) {
      this.wakeEmitter = scene.add.particles(x, y, 'wake', {
        speed: { min: 2, max: 6 },
        scale: { start: 0.2, end: 0.05 },
        alpha: { start: 0.35, end: 0 },
        lifespan: { min: 300, max: 500 },
        frequency: 100,
        quantity: 1,
        emitting: true,
      });
      this.wakeEmitter.setDepth(2);
    }

    // --- Sonar range ring (pulsing blue) ---
    this.sonarRingGfx = scene.add.graphics();
    this.add(this.sonarRingGfx);

    // Sonar pulse effect (periodic expanding ring)
    this._sonarPulseGfx = null;
  }

  getEffectiveSonarRange() {
    return this.sonarRange * (1 + 0.25 * (this.upgrades.SONAR || 0));
  }

  getEffectiveDamage() {
    return Math.floor(this.stats.damage * (1 + 0.3 * (this.upgrades.TORPEDO || 0)));
  }

  getEffectiveFireRate() {
    return this.stats.fireRate;
  }

  update() {
    super.update(); // Ship route following
    if (!this.alive) return;
    const now = this.scene.time.now;

    // --- Sonar detection: reveal IRGC submarines ---
    this._updateSonar();

    // --- Fire torpedoes at IRGC boats/surfaced subs ---
    if (now - this.lastFired >= this.getEffectiveFireRate()) {
      const target = this._findTarget();
      if (target) {
        this.lastFired = now;
        const config = { ...PROJECTILES.TORPEDO, damage: this.getEffectiveDamage() };
        this.scene.fireProjectile(this.x, this.y, target, config, 'coalition');
        this._torpedoFlash();
      }
    }

    // --- Sonar range ring (static, subtle) ---
    if (this._sonarDirty !== this.getEffectiveSonarRange()) {
      this._sonarDirty = this.getEffectiveSonarRange();
      this.sonarRingGfx.clear();
      this.sonarRingGfx.lineStyle(1, 0x42a5f5, 0.08);
      this.sonarRingGfx.strokeCircle(0, 0, this._sonarDirty);
    }
  }

  _updateSonar() {
    const now = this.scene.time.now;
    const range = this.getEffectiveSonarRange();

    // Detect IRGC subs
    for (const boat of this.scene.irgcBoats?.getChildren() || []) {
      if (!boat.active || !boat.isSub) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, boat.x, boat.y);
      boat.detected = dist < range;
    }

    // Periodic sonar pulse visual (every 3s)
    if (now - this.sonarPulseTime > 3000) {
      this.sonarPulseTime = now;
      this._sonarPulse();
    }
  }

  _sonarPulse() {
    if (!this.scene || !this.scene.sys?.isActive()) return;
    const ring = this.scene.add.graphics().setDepth(6);
    ring.x = this.x; ring.y = this.y;

    this.scene.tweens.add({
      targets: ring, alpha: 0, duration: 1200,
      onUpdate: (tween) => {
        if (!ring.active) return;
        const r = 10 + tween.progress * this.getEffectiveSonarRange();
        ring.clear();
        ring.lineStyle(1.5 - tween.progress, 0x42a5f5, 0.3 - tween.progress * 0.3);
        ring.strokeCircle(0, 0, r);
      },
      onComplete: () => { if (ring.active) ring.destroy(); },
    });
  }

  _findTarget() {
    let nearest = null, nearDist = this.stats.range;

    // Target IRGC boats (fast boats + surfaced/detected subs)
    for (const boat of this.scene.irgcBoats?.getChildren() || []) {
      if (!boat.active || !boat.alive) continue;
      // For subs: only target if surfaced or detected
      if (boat.isSub && boat.submerged && !boat.detected) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, boat.x, boat.y);
      if (dist < nearDist) { nearDist = dist; nearest = boat; }
    }

    // Also target detected mines
    for (const m of this.scene.mines?.getChildren() || []) {
      if (!m.active || !m.detected || m.detonated) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, m.x, m.y);
      if (dist < nearDist) { nearDist = dist; nearest = m; }
    }

    return nearest;
  }

  _torpedoFlash() {
    if (!this.scene) return;
    const rad = this.rotation;
    const mx = this.x + Math.cos(rad) * 14;
    const my = this.y + Math.sin(rad) * 14;

    const flash = this.scene.add.circle(mx, my, 3, 0x00bcd4, 0.8).setDepth(12);
    this.scene.tweens.add({
      targets: flash, scaleX: 2, scaleY: 2, alpha: 0,
      duration: 200, onComplete: () => flash.destroy(),
    });

    // Bubble burst
    if (this.scene.textures.exists('wake')) {
      const bubbles = this.scene.add.particles(mx, my, 'wake', {
        speed: { min: 10, max: 30 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 300,
        quantity: 4,
        emitting: false,
      });
      bubbles.setDepth(6);
      bubbles.explode(4);
      this.scene.time.delayedCall(500, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (bubbles?.active) bubbles.destroy();
      });
    }
  }

  // Reset detected flags on IRGC subs when this sub is destroyed
  _clearSonarDetections() {
    for (const boat of this.scene?.irgcBoats?.getChildren() || []) {
      if (boat.isSub) boat.detected = false;
    }
  }

  onReachedEnd() {
    this._clearSonarDetections();
    this.alive = false;
    if (this.body) this.body.setVelocity(0, 0);
    this._cleanupEffects();
    this.destroy();
  }

  destroy(fromScene) {
    this._clearSonarDetections();
    super.destroy(fromScene);
  }
}
