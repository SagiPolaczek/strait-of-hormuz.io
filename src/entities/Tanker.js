import { Ship } from './Ship.js';
import { ECONOMY } from '../config/constants.js';

export class Tanker extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
  }

  onReachedEnd() {
    this.scene.onTankerScored(this);
    this.alive = false;
    if (this.body) this.body.setVelocity(0, 0);

    const text = this.scene.add.text(this.x, this.y, `+${ECONOMY.TANKER_BONUS} 🛢️`, {
      fontSize: '20px', color: '#4CAF50', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
    this.scene.tweens.add({
      targets: text, y: text.y - 40, alpha: 0, duration: 1000,
      onComplete: () => text.destroy(),
    });

    this.destroy();
  }
}
