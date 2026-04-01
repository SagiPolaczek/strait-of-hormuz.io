import Phaser from 'phaser';
import { Ship } from './Ship.js';
import { PROJECTILES } from '../config/units.js';

export class Destroyer extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
    this.lastFired = 0;
    this.currentTarget = null;

    // Radar dish (small rotating line on top of bridge)
    this.radarGfx = scene.add.graphics();
    this.radarGfx.lineStyle(1.5, 0x42a5f5, 0.7);
    this.radarGfx.lineBetween(0, 0, 6, 0);
    this.radarGfx.fillStyle(0x42a5f5, 0.8);
    this.radarGfx.fillCircle(0, 0, 1.5);
    this.add(this.radarGfx);

    // Animate radar rotating
    scene.tweens.add({
      targets: this.radarGfx,
      angle: 360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear',
    });

    // Gun turret (rotates toward target)
    this.turretGfx = scene.add.graphics();
    this._drawTurret(this.turretGfx);
    this.turretGfx.x = 8; // positioned near bow
    this.add(this.turretGfx);
  }

  // Override hull for sleek military destroyer
  _drawHull(gfx) {
    gfx.clear();

    // Sleek angular hull (narrower, more angular)
    gfx.fillStyle(0x546e7a, 0.95);
    gfx.beginPath();
    gfx.moveTo(20, 0);       // sharp bow
    gfx.lineTo(12, -7);      // upper bow
    gfx.lineTo(-12, -6);     // upper stern
    gfx.lineTo(-16, -3);     // stern taper
    gfx.lineTo(-16, 3);      // stern taper
    gfx.lineTo(-12, 6);      // lower stern
    gfx.lineTo(12, 7);       // lower bow
    gfx.closePath();
    gfx.fillPath();

    // Hull outline
    gfx.lineStyle(1.2, 0x90a4ae, 0.8);
    gfx.beginPath();
    gfx.moveTo(20, 0);
    gfx.lineTo(12, -7);
    gfx.lineTo(-12, -6);
    gfx.lineTo(-16, -3);
    gfx.lineTo(-16, 3);
    gfx.lineTo(-12, 6);
    gfx.lineTo(12, 7);
    gfx.closePath();
    gfx.strokePath();

    // Blue accent stripe along the hull
    gfx.lineStyle(1.5, 0x2196f3, 0.6);
    gfx.beginPath();
    gfx.moveTo(18, 0);
    gfx.lineTo(12, -5.5);
    gfx.lineTo(-10, -4.5);
    gfx.strokePath();
    gfx.beginPath();
    gfx.moveTo(18, 0);
    gfx.lineTo(12, 5.5);
    gfx.lineTo(-10, 4.5);
    gfx.strokePath();

    // Bridge/superstructure
    gfx.fillStyle(0x607d8b, 0.9);
    gfx.fillRect(-4, -3.5, 10, 7);
    gfx.lineStyle(0.8, 0x78909c, 0.6);
    gfx.strokeRect(-4, -3.5, 10, 7);

    // Bridge windows (small bright rectangles)
    gfx.fillStyle(0xb3e5fc, 0.7);
    gfx.fillRect(-2, -2, 2, 1.5);
    gfx.fillRect(1, -2, 2, 1.5);
    gfx.fillRect(4, -2, 2, 1.5);

    // Funnel
    gfx.fillStyle(0x455a64, 0.9);
    gfx.fillRect(-8, -3, 3, 6);

    // Antenna mast
    gfx.lineStyle(1, 0x78909c, 0.6);
    gfx.lineBetween(0, -3.5, 0, -8);
    gfx.lineBetween(-1, -7, 1, -7);
  }

  _drawTurret(gfx) {
    gfx.clear();
    // Turret base (circle)
    gfx.fillStyle(0x455a64, 0.9);
    gfx.fillCircle(0, 0, 3);
    // Gun barrel
    gfx.fillStyle(0x37474f, 1);
    gfx.fillRect(0, -1, 8, 2);
    // Barrel tip
    gfx.fillStyle(0x263238, 1);
    gfx.fillRect(7, -1.2, 2, 2.4);
  }

  update() {
    super.update();
    if (!this.alive) return;

    const now = this.scene.time.now;

    // Find target for turret rotation (even if not ready to fire)
    const target = this.findNearestEnemy();
    this.currentTarget = target;

    // Rotate turret toward target (in local coordinates)
    if (target && this.turretGfx && this.turretGfx.active) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const worldAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      // Turret angle is relative to the ship's rotation
      this.turretGfx.angle = worldAngle - this.angle;
    }

    if (now - this.lastFired < this.stats.fireRate) return;

    if (target) {
      this.lastFired = now;
      this._muzzleFlash();
      this.scene.fireProjectile(this.x, this.y, target, PROJECTILES.DESTROYER_SHELL, 'coalition');
    }
  }

  _muzzleFlash() {
    if (!this.scene) return;

    // Calculate muzzle position in world space (end of turret barrel)
    const shipRad = this.rotation;
    const turretRad = this.turretGfx.rotation + shipRad;
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
      this.scene.time.delayedCall(300, () => { if (sparks && sparks.active) sparks.destroy(); });
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
      this.scene.time.delayedCall(500, () => { if (puff && puff.active) puff.destroy(); });
    }
  }

  findNearestEnemy() {
    const launchers = this.scene.irgcTowers?.getChildren() || [];
    let nearest = null;
    let nearestDist = this.stats.range;

    for (const launcher of launchers) {
      if (!launcher.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, launcher.x, launcher.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = launcher;
      }
    }
    return nearest;
  }
}
