import Phaser from 'phaser';

export class CruiseMissile extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.scene = scene;
    this.hp = 60;
    this.damage = 120;
    this.speed = 100;
    this.isAirTarget = true;
    this.target = null;
    this.alive = true;

    // Missile body
    this.bodySprite = scene.add.image(0, 0, 'spr_cruise_missile').setOrigin(0.5);
    this.add(this.bodySprite);

    // HP bar
    this.hpBarBg = scene.add.rectangle(0, -14, 28, 3, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-12, -14, 24, 2, 0xef5350).setOrigin(0, 0.5);
    this.add([this.hpBarBg, this.hpBar]);

    // Smoke trail
    if (scene.textures.exists('smoke')) {
      this.trail = scene.add.particles(x, y, 'smoke', {
        speed: { min: 5, max: 15 },
        scale: { start: 0.5, end: 0.15 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 600,
        frequency: 30,
        quantity: 1,
        emitting: true,
      });
      this.trail.setDepth(4);
    }

    // Pulsing glow
    scene.tweens.add({
      targets: this.bodySprite,
      alpha: { from: 0.8, to: 1 },
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(8);
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

    if (dist < 20) {
      this.target.takeDamage(this.damage);
      this._onImpact();
      return;
    }

    const vx = (dx / dist) * this.speed;
    const vy = (dy / dist) * this.speed;
    if (this.body) this.body.setVelocity(vx, vy);
    this.angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (this.trail?.active) {
      const rad = this.rotation;
      this.trail.setPosition(this.x - Math.cos(rad) * 12, this.y - Math.sin(rad) * 12);
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
    this.hp -= amount;
    this.hpBar.width = 24 * Math.max(0, this.hp / 60);
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
      const fire = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 60, max: 180 }, scale: { start: 1.2, end: 0 },
        lifespan: { min: 300, max: 800 }, quantity: 15, emitting: false,
      });
      fire.setDepth(20); fire.explode(15);
      this.scene.time.delayedCall(1000, () => { if (fire?.active) fire.destroy(); });
    }
    const flash = this.scene.add.circle(wx, wy, 6, 0xffffff, 1).setDepth(21);
    this.scene.tweens.add({ targets: flash, scaleX: 5, scaleY: 5, alpha: 0, duration: 350, onComplete: () => flash.destroy() });
    this._cleanup(); this.destroy();
  }

  _onDestroyed() {
    const wx = this.x, wy = this.y;
    if (this.scene.textures.exists('fire')) {
      const p = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 40, max: 100 }, scale: { start: 0.8, end: 0 },
        lifespan: 500, quantity: 8, emitting: false,
      });
      p.setDepth(20); p.explode(8);
      this.scene.time.delayedCall(700, () => { if (p?.active) p.destroy(); });
    }
    const txt = this.scene.add.text(wx, wy - 15, '✓ INTERCEPTED', {
      fontSize: '13px', fontFamily: '"Share Tech Mono", monospace',
      color: '#4CAF50', fontStyle: 'bold', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({ targets: txt, y: wy - 40, alpha: 0, duration: 800, onComplete: () => txt.destroy() });
    this._cleanup(); this.destroy();
  }

  _cleanup() {
    const trail = this.trail;
    if (trail?.active) {
      trail.stop();
      if (this.scene?.time) {
        this.scene.time.delayedCall(700, () => { if (trail?.active) trail.destroy(); });
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
