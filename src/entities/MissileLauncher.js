import Phaser from 'phaser';
import { PROJECTILES } from '../config/units.js';

export class MissileLauncher extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.stats = stats;
    this.hp = stats.hp;
    this.lastFired = 0;

    this.base = scene.add.circle(0, 0, 18, 0xf44336, 0.6).setStrokeStyle(2, 0xf44336);
    this.label = scene.add.text(0, 0, stats.icon, { fontSize: '20px' }).setOrigin(0.5);
    this.add([this.base, this.label]);

    this.rangeCircle = scene.add.circle(0, 0, stats.range, 0xf44336, 0.04)
      .setStrokeStyle(1, 0xf44336, 0.15);
    this.add(this.rangeCircle);

    this.hpBar = scene.add.rectangle(0, -26, 32, 3, 0x4caf50).setOrigin(0.5);
    this.add(this.hpBar);

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    if (this.body) this.body.setCircle(18, -18, -18);
  }

  update() {
    const now = this.scene.time.now;
    if (now - this.lastFired < this.stats.fireRate) return;

    const target = this.findNearestShip();
    if (target) {
      this.lastFired = now;
      this.scene.fireProjectile(this.x, this.y, target, PROJECTILES.MISSILE, 'irgc');
    }
  }

  findNearestShip() {
    const ships = this.scene.coalitionShips?.getChildren() || [];
    let nearest = null;
    let nearestDist = this.stats.range;

    for (const ship of ships) {
      if (!ship.active || !ship.alive) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, ship.x, ship.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = ship;
      }
    }
    return nearest;
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 32 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    if (this.hp <= 0) {
      const boom = this.scene.add.text(this.x, this.y, '💥', { fontSize: '28px' }).setOrigin(0.5).setDepth(10);
      this.scene.time.delayedCall(400, () => boom.destroy());
      this.destroy();
      return true;
    }
    return false;
  }
}
