import Phaser from 'phaser';

export class OilRig extends Phaser.GameObjects.Container {
  constructor(scene, x, y, side, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.side = side;
    this.stats = stats;
    this.hp = stats.hp;

    const color = side === 'coalition' ? 0x2196f3 : 0xf44336;
    this.base = scene.add.circle(0, 0, 20, color, 0.6).setStrokeStyle(2, color);
    this.label = scene.add.text(0, 0, stats.icon, { fontSize: '24px' }).setOrigin(0.5);
    this.add([this.base, this.label]);

    this.hpBar = scene.add.rectangle(0, -28, 36, 4, 0x4caf50).setOrigin(0.5);
    this.add(this.hpBar);

    scene.add.existing(this);
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 36 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }
}
