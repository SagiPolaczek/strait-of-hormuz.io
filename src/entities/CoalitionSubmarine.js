import Phaser from 'phaser';
import { Ship } from './Ship.js';
import { PROJECTILES } from '../config/units.js';
import { WATER_POLYGON } from '../config/zones.js';
import { getEffectiveSonarRange as calcSonar, getEffectiveDamage as calcDamage } from '../utils/calculations.js';

export class CoalitionSubmarine extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, { ...stats, _spriteKey: 'spr_submarine' });
    this.isSubmerged = true; // immune to IRGC surface weapons
    this.lastFired = 0;
    this.sonarPulseTime = 0;
    this.sonarRange = stats.sonarRange || 300;
    this.upgrades = {};

    // Patrol behavior (overrides Ship route-following)
    this.patrolState = 'PATROL'; // PATROL or PURSUE
    this.patrolTarget = null; // {x, y} point to patrol toward

    // Cache water polygon geometry for patrol point sampling
    const waterPoints = WATER_POLYGON.map(([px, py]) => new Phaser.Geom.Point(px, py));
    this._waterGeom = new Phaser.Geom.Polygon(waterPoints);

    this._pickPatrolPoint();

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

  _pickPatrolPoint() {
    // Random point inside WATER_POLYGON using rejection sampling
    // Bias toward central strait (x: 400-1400, y: 400-1000) for gameplay relevance
    const bounds = { minX: 100, maxX: 1800, minY: 350, maxY: 1200 };
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(bounds.minX, bounds.maxX);
      const y = Phaser.Math.Between(bounds.minY, bounds.maxY);
      if (Phaser.Geom.Polygon.Contains(this._waterGeom, x, y)) {
        this.patrolTarget = { x, y };
        return;
      }
    }
    // Fallback: center of map (always in water)
    this.patrolTarget = { x: 800, y: 700 };
  }

  getEffectiveSonarRange() {
    return calcSonar(this.sonarRange, this.upgrades.SONAR || 0);
  }

  getEffectiveDamage() {
    return calcDamage(this.stats.damage, this.upgrades.TORPEDO || 0);
  }

  getEffectiveFireRate() {
    return this.stats.fireRate;
  }

  update() {
    if (!this.alive) return;
    const now = this.scene.time.now;

    // --- Sonar detection ---
    this._updateSonar();

    // --- Patrol / Pursue behavior ---
    const enemy = this._findTarget();
    let vx = 0, vy = 0;

    if (enemy) {
      this.patrolState = 'PURSUE';
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = this.getEffectiveSpeed();

      if (dist > 40) {
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
      }

      // Fire torpedoes
      if (now - this.lastFired >= this.getEffectiveFireRate()) {
        if (dist < this.stats.range) {
          this.lastFired = now;
          const config = { ...PROJECTILES.TORPEDO, damage: this.getEffectiveDamage() };
          this.scene.fireProjectile(this.x, this.y, enemy, config, 'coalition');
          this._torpedoFlash();
        }
      }
    } else {
      this.patrolState = 'PATROL';
      if (!this.patrolTarget) this._pickPatrolPoint();

      const dx = this.patrolTarget.x - this.x;
      const dy = this.patrolTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = this.getEffectiveSpeed() * 0.6; // slower patrol speed

      if (dist < 30) {
        this._pickPatrolPoint(); // reached patrol point, pick next
      } else {
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
      }
    }

    // --- Water boundary enforcement ---
    if (vx !== 0 || vy !== 0) {
      const moveAngle = Math.atan2(vy, vx);
      const aheadX = this.x + Math.cos(moveAngle) * 30;
      const aheadY = this.y + Math.sin(moveAngle) * 30;

      if (Phaser.Geom.Polygon.Contains(this._waterGeom, aheadX, aheadY)) {
        if (this.body) this.body.setVelocity(vx, vy);
        this.angle = Math.atan2(vy, vx) * (180 / Math.PI);
      } else {
        // Would leave water — stop and reroute
        if (this.body) this.body.setVelocity(0, 0);
        this._pickPatrolPoint();
        this.patrolState = 'PATROL';
      }
    } else {
      if (this.body) this.body.setVelocity(0, 0);
    }

    // Safety: if already outside water somehow, steer back to center
    if (!Phaser.Geom.Polygon.Contains(this._waterGeom, this.x, this.y)) {
      this.patrolTarget = { x: 800, y: 700 };
      this.patrolState = 'PATROL';
    }

    // --- Wake emitter position ---
    if (this.wakeEmitter?.active) {
      const rad = this.rotation;
      this.wakeEmitter.setPosition(this.x - Math.cos(rad) * 16, this.y - Math.sin(rad) * 16);
    }

    // --- Sonar range ring (update only when range changes) ---
    if (this._sonarDirty !== this.getEffectiveSonarRange()) {
      this._sonarDirty = this.getEffectiveSonarRange();
      this.sonarRingGfx.clear();
      this.sonarRingGfx.lineStyle(1, 0x42a5f5, 0.08);
      this.sonarRingGfx.strokeCircle(0, 0, this._sonarDirty);
    }

    // --- Sonar pulse visual (every 3s) ---
    if (now - this.sonarPulseTime > 3000) {
      this.sonarPulseTime = now;
      this._sonarPulse();
    }
  }

  _updateSonar() {
    const range = this.getEffectiveSonarRange();

    // Detect IRGC subs
    for (const boat of this.scene.irgcBoats?.getChildren() || []) {
      if (!boat.active || !boat.isSub) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, boat.x, boat.y);
      boat.detected = dist < range;
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

  destroy(fromScene) {
    this._clearSonarDetections();
    super.destroy(fromScene);
  }
}
