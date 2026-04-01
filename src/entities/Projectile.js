import Phaser from 'phaser';
import { ensureTextures } from '../utils/textures.js';

export class Projectile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, target, config, side) {
    super(scene, x, y);
    this.scene = scene;
    this.target = target;
    this.config = config;
    this.side = side;
    this.damage = config.damage;

    ensureTextures(scene);

    const isIRGC = side === 'irgc';
    const bodyColor = isIRGC ? 0xff4444 : 0x42a5f5;
    const glowColor = isIRGC ? 0xff6600 : 0x82b1ff;
    const trailColor = isIRGC ? 0xff4400 : 0x64b5f6;

    // --- Missile body as sprite ---
    const textureKey = side === 'irgc' ? 'spr_proj_missile' : 'spr_proj_shell';
    this.bodySprite = scene.add.image(0, 0, textureKey).setOrigin(0.5);
    this.add(this.bodySprite);

    // Trail particle emitter
    this.trailEmitter = scene.add.particles(x, y, 'flare', {
      speed: { min: 5, max: 20 },
      scale: { start: isIRGC ? 0.5 : 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: isIRGC ? 400 : 250,
      frequency: 20,
      quantity: 1,
      tint: trailColor,
      emitting: true,
    });
    this.trailEmitter.setDepth(4);

    // Smoke trail (lingers behind)
    this.smokeTrail = scene.add.particles(x, y, 'smoke', {
      speed: { min: 2, max: 8 },
      scale: { start: 0.3, end: 0.1 },
      alpha: { start: 0.3, end: 0 },
      lifespan: isIRGC ? 500 : 300,
      frequency: 60,
      quantity: 1,
      emitting: true,
    });
    this.smokeTrail.setDepth(3);

    // Pulsing glow
    scene.tweens.add({
      targets: this.bodySprite,
      alpha: { from: 0.7, to: 1 },
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(5);
  }

  update() {
    if (!this.target || !this.target.active) {
      this.cleanDestroy();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 15) {
      this._onImpact();
      if (this.target?.active) {
        this.target.takeDamage(this.damage);
      }
      this.cleanDestroy();
      return;
    }

    const vx = (dx / dist) * this.config.speed;
    const vy = (dy / dist) * this.config.speed;
    if (this.body) this.body.setVelocity(vx, vy);

    // Rotate to face direction
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    this.angle = angle;

    // Update trail positions
    if (this.trailEmitter && this.trailEmitter.active) {
      const rad = this.rotation;
      this.trailEmitter.setPosition(
        this.x - Math.cos(rad) * 6,
        this.y - Math.sin(rad) * 6
      );
    }
    if (this.smokeTrail && this.smokeTrail.active) {
      const rad = this.rotation;
      this.smokeTrail.setPosition(
        this.x - Math.cos(rad) * 8,
        this.y - Math.sin(rad) * 8
      );
    }
  }

  _onImpact() {
    if (!this.scene) return;
    const wx = this.x;
    const wy = this.y;
    const isIRGC = this.side === 'irgc';
    const impactColor = isIRGC ? 0xff6600 : 0x42a5f5;

    // Explosion ring that expands and fades
    const ring = this.scene.add.graphics().setDepth(15);
    ring.lineStyle(3, impactColor, 1);
    ring.strokeCircle(0, 0, 5);
    ring.x = wx;
    ring.y = wy;

    let ringRadius = 5;
    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        const progress = tween.progress;
        const r = 5 + progress * 25;
        ring.clear();
        ring.lineStyle(3 - progress * 2.5, impactColor, 1 - progress);
        ring.strokeCircle(0, 0, r);
      },
      onComplete: () => ring.destroy(),
    });

    // Small flash
    const flash = this.scene.add.circle(wx, wy, 3, 0xffffff, 1).setDepth(16);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    // Impact sparks
    const sparks = this.scene.add.particles(wx, wy, 'flare', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      lifespan: 200,
      quantity: 6,
      tint: impactColor,
      emitting: false,
    });
    sparks.setDepth(15);
    sparks.explode(6);
    this.scene.time.delayedCall(400, () => { if (sparks && sparks.active) sparks.destroy(); });
  }

  cleanDestroy() {
    if (this.trailEmitter?.active) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
      this.trailEmitter = null;
    }
    if (this.smokeTrail?.active) {
      this.smokeTrail.stop();
      this.smokeTrail.destroy();
      this.smokeTrail = null;
    }
    this.destroy();
  }

  destroy(fromScene) {
    if (this.trailEmitter?.active) {
      this.trailEmitter.stop();
      this.trailEmitter.destroy();
      this.trailEmitter = null;
    }
    if (this.smokeTrail?.active) {
      this.smokeTrail.stop();
      this.smokeTrail.destroy();
      this.smokeTrail = null;
    }
    super.destroy(fromScene);
  }
}
