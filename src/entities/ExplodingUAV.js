import Phaser from 'phaser';

export class ExplodingUAV extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.scene = scene;
    this.hp = 30;
    this.damage = 70;
    this.speed = 180;
    this.isAirTarget = true;
    this.target = null;
    this.alive = true;

    // UAV body sprite
    this.bodySprite = scene.add.image(0, 0, 'spr_uav').setOrigin(0.5);
    this.add(this.bodySprite);

    // Red blinking light
    this.blinkLight = scene.add.circle(0, 2, 2, 0xef5350).setAlpha(1);
    this.add(this.blinkLight);
    scene.tweens.add({
      targets: this.blinkLight,
      alpha: { from: 1, to: 0.3 },
      duration: 200,
      yoyo: true,
      repeat: -1,
    });

    // Trail
    if (scene.textures.exists('smoke')) {
      this.trail = scene.add.particles(x, y, 'smoke', {
        speed: { min: 3, max: 10 },
        scale: { start: 0.2, end: 0.05 },
        alpha: { start: 0.35, end: 0 },
        lifespan: 250,
        frequency: 40,
        quantity: 1,
        emitting: true,
      });
      this.trail.setDepth(5);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9);
  }

  update() {
    if (!this.alive) return;

    if (!this.target || !this.target.active) {
      this.target = this._findTarget();
    }
    if (!this.target) return;

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 18) {
      this.target.takeDamage(this.damage);
      this._onImpact();
      return;
    }

    const d = dist || 1;
    if (this.body) this.body.setVelocity((dx / d) * this.speed, (dy / d) * this.speed);
    this.angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (this.trail?.active) {
      const rad = this.rotation;
      this.trail.setPosition(this.x - Math.cos(rad) * 6, this.y - Math.sin(rad) * 6);
    }
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
    for (const d of this.scene.coalitionDefenses?.getChildren() || []) {
      if (!d.active) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, d.x, d.y);
      if (dist < nearDist) { nearDist = dist; nearest = d; }
    }
    return nearest;
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      this._onDestroyed();
      return true;
    }
    return false;
  }

  _onImpact() {
    this.alive = false;
    const wx = this.x, wy = this.y;
    if (this.scene.textures.exists('fire')) {
      const p = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 50, max: 120 }, scale: { start: 0.8, end: 0 },
        lifespan: 500, quantity: 10, emitting: false,
      });
      p.setDepth(20); p.explode(10);
      const sceneRef = this.scene;
      sceneRef.time.delayedCall(700, () => { if (p?.active) p.destroy(); });
    }
    this._cleanup(); this.destroy();
  }

  _onDestroyed() {
    const wx = this.x, wy = this.y;
    if (this.scene.textures.exists('fire')) {
      const p = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 30, max: 70 }, scale: { start: 0.5, end: 0 },
        lifespan: 400, quantity: 5, emitting: false,
      });
      p.setDepth(20); p.explode(5);
      const sceneRef = this.scene;
      sceneRef.time.delayedCall(500, () => { if (p?.active) p.destroy(); });
    }
    this._cleanup(); this.destroy();
  }

  _cleanup() {
    const trail = this.trail;
    if (trail?.active) {
      trail.stop();
      if (this.scene?.time) {
        this.scene.time.delayedCall(400, () => { if (trail?.active) trail.destroy(); });
      } else {
        trail.destroy();
      }
    }
    this.trail = null;
  }

  destroy(fromScene) {
    const trail = this.trail;
    if (trail?.active) {
      trail.stop();
      trail.destroy();
    }
    this.trail = null;
    super.destroy(fromScene);
  }
}
