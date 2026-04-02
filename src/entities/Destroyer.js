import Phaser from 'phaser';
import { Ship } from './Ship.js';
import { PROJECTILES } from '../config/units.js';

export class Destroyer extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
    this.lastFired = 0;
    this.currentTarget = null;

    // Manual command: player-directed movement
    this.commandPoint = null;  // {x, y} — move-to target
    this.patrolCenter = null;  // {x, y} — patrol around this point once reached
    this.patrolAngle = 0;
    this.patrolRadius = 80;
    this.isCommanded = false;

    // Radar dish (lightweight graphics — not worth a texture)
    this.radarGfx = scene.add.graphics();
    this.radarGfx.lineStyle(1, 0x82b1ff, 0.6);
    this.radarGfx.lineBetween(0, 0, 0, -6);
    this.add(this.radarGfx);
    scene.tweens.add({
      targets: this.radarGfx,
      angle: 360,
      duration: 2000,
      repeat: -1,
    });

    // Gun turret (sprite, rotates toward target)
    this.turretSprite = scene.add.image(8, 0, 'spr_destroyer_turret').setOrigin(0.37, 0.5);
    this.add(this.turretSprite);
  }

  getEffectiveDamage() {
    return Math.floor(this.stats.damage * (1 + 0.3 * (this.upgrades.DAMAGE || 0)));
  }

  getEffectiveFireRate() {
    return Math.floor(this.stats.fireRate * (1 - 0.2 * (this.upgrades.FIRE_RATE || 0)));
  }

  // Set a move command — destroyer will navigate there, then patrol
  setCommand(x, y) {
    this.commandPoint = { x, y };
    this.patrolCenter = null;
    this.isCommanded = true;
  }

  update() {
    if (this.isCommanded) {
      this._updateCommanded();
    } else {
      super.update(); // default route-following
    }
    if (!this.alive) return;

    const now = this.scene.time.now;

    // Find target for turret rotation (even if not ready to fire)
    const target = this.findNearestEnemy();
    this.currentTarget = target;

    // Rotate turret toward target (in local coordinates)
    if (target && this.turretSprite && this.turretSprite.active) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const worldAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.turretSprite.angle = worldAngle - this.angle;
    }

    if (now - this.lastFired < this.getEffectiveFireRate()) return;

    if (target) {
      this.lastFired = now;
      this._muzzleFlash();
      const config = { ...PROJECTILES.DESTROYER_SHELL, damage: this.getEffectiveDamage() };
      this.scene.fireProjectile(this.x, this.y, target, config, 'coalition');
    }
  }

  _updateCommanded() {
    if (!this.alive) return;

    // Phase 1: Move to command point
    if (this.commandPoint && !this.patrolCenter) {
      const dx = this.commandPoint.x - this.x;
      const dy = this.commandPoint.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) {
        // Arrived — start patrolling
        this.patrolCenter = { ...this.commandPoint };
        this.commandPoint = null;
        this.patrolAngle = Math.atan2(this.y - this.patrolCenter.y, this.x - this.patrolCenter.x);
      } else {
        const speed = this.getEffectiveSpeed();
        if (this.body) this.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }
    }

    // Phase 2: Patrol in a circle around the point
    if (this.patrolCenter) {
      this.patrolAngle += 0.008; // slow orbit
      const tx = this.patrolCenter.x + Math.cos(this.patrolAngle) * this.patrolRadius;
      const ty = this.patrolCenter.y + Math.sin(this.patrolAngle) * this.patrolRadius;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = this.getEffectiveSpeed() * 0.5;

      if (dist > 5) {
        if (this.body) this.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        this.angle = Math.atan2(dy, dx) * (180 / Math.PI);
      } else {
        if (this.body) this.body.setVelocity(0, 0);
      }
    }

    // Wake emitter
    if (this.wakeEmitter?.active) {
      const rad = this.rotation;
      this.wakeEmitter.setPosition(this.x - Math.cos(rad) * 16, this.y - Math.sin(rad) * 16);
    }
  }

  _muzzleFlash() {
    if (!this.scene || !this.turretSprite?.active) return;

    // Calculate muzzle position in world space (end of turret barrel)
    const shipRad = this.rotation;
    const turretRad = this.turretSprite.rotation + shipRad;
    const muzzleX = this.x + Math.cos(turretRad) * 16;
    const muzzleY = this.y + Math.sin(turretRad) * 16;

    // Flash circle
    const flash = this.scene.add.circle(muzzleX, muzzleY, 4, 0xffff88, 1).setDepth(12);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });

    // Muzzle sparks
    if (this.scene.textures.exists('flare')) {
      const sparks = this.scene.add.particles(muzzleX, muzzleY, 'flare', {
        speed: { min: 30, max: 70 },
        angle: { min: (turretRad * 180 / Math.PI) - 25, max: (turretRad * 180 / Math.PI) + 25 },
        scale: { start: 0.4, end: 0 },
        lifespan: 150,
        tint: 0xffcc00,
        quantity: 4,
        emitting: false,
      });
      sparks.setDepth(12);
      sparks.explode(4);
      this.scene.time.delayedCall(300, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (sparks && sparks.active) sparks.destroy();
      });
    }

    // Small smoke puff
    if (this.scene.textures.exists('smoke')) {
      const puff = this.scene.add.particles(muzzleX, muzzleY, 'smoke', {
        speed: { min: 5, max: 20 },
        angle: { min: (turretRad * 180 / Math.PI) - 40, max: (turretRad * 180 / Math.PI) + 40 },
        scale: { start: 0.4, end: 0.1 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 300,
        quantity: 3,
        emitting: false,
      });
      puff.setDepth(11);
      puff.explode(3);
      this.scene.time.delayedCall(500, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (puff && puff.active) puff.destroy();
      });
    }
  }

  findNearestEnemy() {
    let nearest = null;
    let nearestDist = this.stats.range;

    // Target IRGC towers (weapons platforms — high priority)
    for (const t of this.scene.irgcTowers?.getChildren() || []) {
      if (!t.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
      if (dist < nearestDist) { nearestDist = dist; nearest = t; }
    }

    // Target IRGC oil rigs (enemy economy)
    for (const r of this.scene.irgcRigs?.getChildren() || []) {
      if (!r.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, r.x, r.y);
      if (dist < nearestDist) { nearestDist = dist; nearest = r; }
    }

    // Target detected mines (priority — they're an immediate threat)
    for (const m of this.scene.mines?.getChildren() || []) {
      if (!m.active || !m.detected || m.detonated) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, m.x, m.y);
      if (dist < nearestDist) { nearestDist = dist; nearest = m; }
    }

    // Target IRGC boats (fast boats + surfaced/detected subs)
    for (const b of this.scene.irgcBoats?.getChildren() || []) {
      if (!b.active || !b.alive) continue;
      // Submarines: only target if surfaced or detected
      if (b.isSub && b.submerged && !b.detected) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y);
      if (dist < nearestDist) { nearestDist = dist; nearest = b; }
    }

    return nearest;
  }
}
