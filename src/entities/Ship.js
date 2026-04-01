import Phaser from 'phaser';
import { DEFAULT_SHIP_ROUTE } from '../config/zones.js';

export class Ship extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.waypoints = [...DEFAULT_SHIP_ROUTE];
    this.currentWaypoint = 0;
    this.alive = true;

    this.base = scene.add.circle(0, 0, 16, 0x2196f3, 0.5).setStrokeStyle(2, 0x2196f3);
    this.label = scene.add.text(0, 0, stats.icon, { fontSize: '20px' }).setOrigin(0.5);
    this.add([this.base, this.label]);

    this.hpBar = scene.add.rectangle(0, -22, 30, 3, 0x4caf50).setOrigin(0.5);
    this.add(this.hpBar);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    if (this.body) this.body.setCircle(16, -16, -16);
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
    }
  }

  onReachedEnd() {
    this.alive = false;
    if (this.body) this.body.setVelocity(0, 0);
    this.destroy();
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 30 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    if (this.hp <= 0) {
      this.alive = false;
      if (this.body) this.body.setVelocity(0, 0);
      const boom = this.scene.add.text(this.x, this.y, '💥', { fontSize: '32px' }).setOrigin(0.5).setDepth(10);
      this.scene.time.delayedCall(500, () => boom.destroy());
      this.destroy();
      return true;
    }
    return false;
  }
}
