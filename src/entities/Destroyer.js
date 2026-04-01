import { Ship } from './Ship.js';
import { PROJECTILES } from '../config/units.js';

export class Destroyer extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
    this.lastFired = 0;
    this.base.fillColor = 0x1565c0;
    this.base.setStrokeStyle(2, 0x1565c0);
  }

  update() {
    super.update();
    if (!this.alive) return;

    const now = this.scene.time.now;
    if (now - this.lastFired < this.stats.fireRate) return;

    const target = this.findNearestEnemy();
    if (target) {
      this.lastFired = now;
      this.scene.fireProjectile(this.x, this.y, target, PROJECTILES.DESTROYER_SHELL, 'coalition');
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
