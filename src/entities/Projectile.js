import Phaser from 'phaser';

export class Projectile extends Phaser.GameObjects.Arc {
  constructor(scene, x, y, target, config, side) {
    super(scene, x, y, config.radius, 0, 360, false, config.color);
    this.scene = scene;
    this.target = target;
    this.config = config;
    this.side = side;
    this.damage = config.damage;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(5);

    this.trail = scene.add.circle(x, y, config.radius * 0.6, config.color, 0.4).setDepth(4);
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
      this.target.takeDamage(this.damage);
      this.cleanDestroy();
      return;
    }

    const vx = (dx / dist) * this.config.speed;
    const vy = (dy / dist) * this.config.speed;
    if (this.body) this.body.setVelocity(vx, vy);

    if (this.trail && this.trail.active) {
      this.trail.x = this.x - vx * 0.05;
      this.trail.y = this.y - vy * 0.05;
    }
  }

  cleanDestroy() {
    if (this.trail && this.trail.active) this.trail.destroy();
    this.destroy();
  }
}
