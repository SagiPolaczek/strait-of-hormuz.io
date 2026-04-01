import Phaser from 'phaser';
import { Ship } from './Ship.js';

export class Tanker extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
  }

  onReachedEnd() {
    const earned = this.scene.onTankerScored(this);
    this.alive = false;
    if (this.body) this.body.setVelocity(0, 0);

    const wx = this.x;
    const wy = this.y;

    // Triumphant green flash
    const flash = this.scene.add.circle(wx, wy, 8, 0x4caf50, 0.8).setDepth(15);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 5,
      scaleY: 5,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Second green ring wave
    const ring = this.scene.add.circle(wx, wy, 10, 0x66bb6a, 0.6).setDepth(14).setStrokeStyle(2, 0x4caf50);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      delay: 100,
      onComplete: () => ring.destroy(),
    });

    // $$$ particles flying upward
    for (let i = 0; i < 4; i++) {
      const dollarText = this.scene.add.text(
        wx + Phaser.Math.Between(-15, 15),
        wy,
        '$$$',
        {
          fontSize: '16px',
          color: '#4caf50',
          fontStyle: 'bold',
          fontFamily: 'Arial',
          stroke: '#1b5e20',
          strokeThickness: 2,
        }
      ).setOrigin(0.5).setDepth(16);

      this.scene.tweens.add({
        targets: dollarText,
        y: dollarText.y - 40 - i * 12,
        x: dollarText.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: 1000 + i * 200,
        ease: 'Cubic.easeOut',
        delay: i * 80,
        onComplete: () => dollarText.destroy(),
      });
    }

    // Bonus text
    const text = this.scene.add.text(wx, wy - 15, `+${earned}`, {
      fontSize: '22px',
      color: '#66bb6a',
      fontStyle: 'bold',
      fontFamily: 'Arial',
      stroke: '#1b5e20',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(17);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 1400,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });

    // Green particle burst
    if (this.scene.textures.exists('flare')) {
      const particles = this.scene.add.particles(wx, wy, 'flare', {
        speed: { min: 30, max: 80 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 500,
        tint: 0x4caf50,
        quantity: 10,
        emitting: false,
      });
      particles.setDepth(14);
      particles.explode(10);
      this.scene.time.delayedCall(700, () => { if (particles && particles.active) particles.destroy(); });
    }

    this._cleanupEffects();
    this.destroy();
  }
}
