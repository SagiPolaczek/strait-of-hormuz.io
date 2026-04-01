import Phaser from 'phaser';
import { DEFAULT_SHIP_ROUTE } from '../config/zones.js';

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
  if (!scene.textures.exists('spark')) {
    const c = scene.textures.createCanvas('spark', 8, 8);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,255,200,1)');
    g.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
    c.refresh();
  }
  if (!scene.textures.exists('wake')) {
    const c = scene.textures.createCanvas('wake', 8, 8);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    g.addColorStop(0, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.5, 'rgba(200,220,255,0.3)');
    g.addColorStop(1, 'rgba(180,210,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 8);
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

export class Ship extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.waypoints = [...DEFAULT_SHIP_ROUTE];
    this.currentWaypoint = 0;
    this.alive = true;

    ensureTextures(scene);

    // --- Draw the hull ---
    this.hullGfx = scene.add.graphics();
    this._drawHull(this.hullGfx);
    this.add(this.hullGfx);

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
      lifespan: { min: 300, max: 600 },
      frequency: 80,
      quantity: 1,
      emitting: true,
    });
    this.wakeEmitter.setDepth(2);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    if (this.body) this.body.setCircle(16, -16, -16);
    this.setDepth(5);
  }

  // Draws a basic ship hull — subclasses override this
  _drawHull(gfx) {
    gfx.clear();
    // Hull body (pointed bow, flat stern)
    gfx.fillStyle(0x37474f, 0.9);
    gfx.beginPath();
    gfx.moveTo(16, 0);     // bow (front point)
    gfx.lineTo(8, -8);     // upper bow
    gfx.lineTo(-14, -7);   // upper stern
    gfx.lineTo(-16, 0);    // stern center
    gfx.lineTo(-14, 7);    // lower stern
    gfx.lineTo(8, 8);      // lower bow
    gfx.closePath();
    gfx.fillPath();

    // Hull outline
    gfx.lineStyle(1.2, 0x90a4ae, 0.8);
    gfx.beginPath();
    gfx.moveTo(16, 0);
    gfx.lineTo(8, -8);
    gfx.lineTo(-14, -7);
    gfx.lineTo(-16, 0);
    gfx.lineTo(-14, 7);
    gfx.lineTo(8, 8);
    gfx.closePath();
    gfx.strokePath();

    // Cabin/bridge
    gfx.fillStyle(0x546e7a, 0.9);
    gfx.fillRect(-4, -4, 8, 8);
    gfx.lineStyle(0.8, 0x78909c, 0.6);
    gfx.strokeRect(-4, -4, 8, 8);
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
      const vx = (dx / dist) * this.stats.speed;
      const vy = (dy / dist) * this.stats.speed;
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
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 30 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    // Flash red on damage
    if (this.hullGfx && this.hullGfx.active) {
      const origAlpha = this.hullGfx.alpha;
      this.scene.tweens.add({
        targets: this.hullGfx,
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
      this.scene.time.delayedCall(400, () => { if (sparks && sparks.active) sparks.destroy(); });
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
    this._cleanupEffects();
    super.destroy(fromScene);
  }
}
