import Phaser from 'phaser';
import { SHIP_ROUTES } from '../config/zones.js';
import { ensureTextures } from '../utils/textures.js';
import { getMaxHP as calcMaxHP, getEffectiveSpeed as calcSpeed } from '../utils/calculations.js';

export class Ship extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    // Pick a random route for variety
    const route = SHIP_ROUTES[Math.floor(Math.random() * SHIP_ROUTES.length)];
    this.waypoints = [...route];
    this.currentWaypoint = 0;
    this.alive = true;
    this.upgrades = {};
    this._timers = [];

    ensureTextures(scene);

    // --- Sprite hull ---
    const spriteKey = stats._spriteKey || 'spr_tanker';
    this.hullSprite = scene.add.image(0, 0, spriteKey).setOrigin(0.5);
    this.add(this.hullSprite);

    // HP bar with proper styling
    this.hpBarBg = scene.add.rectangle(0, -20, 34, 4, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-15, -20, 30, 2.5, 0x4caf50).setOrigin(0, 0.5);
    this.hpBarBorder = scene.add.graphics();
    this.hpBarBorder.lineStyle(0.8, 0xffffff, 0.5);
    this.hpBarBorder.strokeRect(-17, -22, 34, 4);
    this.add([this.hpBarBg, this.hpBar, this.hpBarBorder]);

    // Wake particle emitter (trails behind)
    this.wakeEmitter = scene.add.particles(0, 0, 'wake', {
      speed: { min: 2, max: 8 },
      scale: { start: 0.5, end: 0.1 },
      alpha: { start: 0.5, end: 0 },
      lifespan: { min: 200, max: 400 },
      frequency: 80,
      quantity: 1,
      tint: 0x82b1ff,
      blendMode: 'ADD',
      emitting: true,
    });
    this.wakeEmitter.setDepth(2);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    if (this.body) this.body.setCircle(16, -16, -16);
    this.setDepth(5);
  }

  getMaxHP() {
    return calcMaxHP(this.stats.hp, this.upgrades.HULL || 0, this.upgrades.ARMOR || 0);
  }

  getEffectiveSpeed() {
    return calcSpeed(this.stats.speed, this.upgrades.ENGINE || 0);
  }

  applyUpgrade(key) {
    const prevMax = this.getMaxHP();
    this.upgrades[key] = (this.upgrades[key] || 0) + 1;
    const newMax = this.getMaxHP();
    if (newMax > prevMax) this.hp += (newMax - prevMax);
  }

  update() {
    if (!this.alive || this.currentWaypoint >= this.waypoints.length) return;

    const [tx, ty] = this.waypoints[this.currentWaypoint];
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      this.currentWaypoint++;
      if (this.currentWaypoint >= this.waypoints.length) {
        this.onReachedEnd();
        return;
      }
    } else {
      const speed = this.getEffectiveSpeed();
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      if (this.body) this.body.setVelocity(vx, vy);

      // Rotate ship to face movement direction
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.angle = angle;
    }

    // Update wake emitter position (behind the ship)
    if (this.wakeEmitter && this.wakeEmitter.active) {
      const rad = this.rotation;
      this.wakeEmitter.setPosition(
        this.x - Math.cos(rad) * 16,
        this.y - Math.sin(rad) * 16
      );
    }
  }

  onReachedEnd() {
    this.alive = false;
    if (this.body) this.body.setVelocity(0, 0);
    this._cleanupEffects();
    this.destroy();
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.getMaxHP());
    this.hpBar.width = 30 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    // Flash red on damage
    if (this.hullSprite && this.hullSprite.active) {
      this.scene.tweens.add({
        targets: this.hullSprite,
        alpha: { from: 0.3, to: 1 },
        duration: 80,
        yoyo: true,
        repeat: 1,
      });
    }

    // Damage sparks
    if (this.scene && this.scene.add) {
      const sparks = this.scene.add.particles(this.x, this.y, 'spark', {
        speed: { min: 30, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        lifespan: 250,
        quantity: 4,
        tint: 0xffcc00,
        emitting: false,
      });
      sparks.setDepth(12);
      sparks.explode(4);
      this.scene.time.delayedCall(400, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (sparks && sparks.active) sparks.destroy();
      });
    }

    if (this.hp <= 0) {
      this.alive = false;
      if (this.body) this.body.setVelocity(0, 0);
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

    this._cleanupEffects();

    // Large explosion with fire
    const fire = this.scene.add.particles(wx, wy, 'fire', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.0, end: 0 },
      lifespan: { min: 300, max: 800 },
      quantity: 15,
      tint: [0xfff8e1, 0xff8f00, 0xff6600, 0xef5350],
      emitting: false,
    });
    fire.setDepth(20);
    fire.explode(15);

    // Smoke cloud
    const smoke = this.scene.add.particles(wx, wy, 'smoke', {
      speed: { min: 10, max: 50 },
      angle: { min: 230, max: 310 },
      scale: { start: 1.5, end: 0.3 },
      lifespan: { min: 800, max: 1600 },
      quantity: 10,
      emitting: false,
    });
    smoke.setDepth(19);
    smoke.explode(10);

    // Debris flying outward
    const debris = this.scene.add.particles(wx, wy, 'debris', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.3 },
      lifespan: { min: 500, max: 1200 },
      gravityY: 100,
      quantity: 8,
      rotate: { min: 0, max: 360 },
      emitting: false,
    });
    debris.setDepth(20);
    debris.explode(8);

    // Explosion flash ring
    const flash = this.scene.add.circle(wx, wy, 5, 0xffffff, 1).setDepth(21);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 5,
      scaleY: 5,
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Cleanup particles
    this.scene.time.delayedCall(1800, () => {
      if (!this.scene || !this.scene.sys?.isActive()) return;
      if (fire && fire.active) fire.destroy();
      if (smoke && smoke.active) smoke.destroy();
      if (debris && debris.active) debris.destroy();
    });
  }

  _cleanupEffects() {
    if (this.wakeEmitter && this.wakeEmitter.active) {
      this.wakeEmitter.destroy();
      this.wakeEmitter = null;
    }
  }

  destroy(fromScene) {
    this._timers.forEach(t => { if (t) t.remove(false); });
    this._timers = [];
    this._cleanupEffects();
    super.destroy(fromScene);
  }
}
