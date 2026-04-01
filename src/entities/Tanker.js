import Phaser from 'phaser';
import { Ship } from './Ship.js';
import { ECONOMY } from '../config/constants.js';

export class Tanker extends Ship {
  constructor(scene, x, y, stats) {
    super(scene, x, y, stats);
  }

  // Override hull drawing for a bulkier tanker shape
  _drawHull(gfx) {
    gfx.clear();

    // Large bulky hull (wider and longer than base ship)
    gfx.fillStyle(0x37474f, 0.95);
    gfx.beginPath();
    gfx.moveTo(20, 0);       // bow (rounded point)
    gfx.lineTo(14, -10);     // upper bow
    gfx.lineTo(-16, -10);    // upper stern
    gfx.lineTo(-20, -6);     // stern corner
    gfx.lineTo(-20, 6);      // stern corner
    gfx.lineTo(-16, 10);     // lower stern
    gfx.lineTo(14, 10);      // lower bow
    gfx.closePath();
    gfx.fillPath();

    // Hull outline
    gfx.lineStyle(1.5, 0x78909c, 0.8);
    gfx.beginPath();
    gfx.moveTo(20, 0);
    gfx.lineTo(14, -10);
    gfx.lineTo(-16, -10);
    gfx.lineTo(-20, -6);
    gfx.lineTo(-20, 6);
    gfx.lineTo(-16, 10);
    gfx.lineTo(14, 10);
    gfx.closePath();
    gfx.strokePath();

    // Deck (lighter grey area)
    gfx.fillStyle(0x546e7a, 0.7);
    gfx.fillRect(-14, -7, 28, 14);

    // Oil barrel markings on deck (orange rectangles)
    gfx.fillStyle(0xff8c00, 0.8);
    gfx.fillRect(-12, -4, 5, 3);
    gfx.fillRect(-4, -4, 5, 3);
    gfx.fillRect(4, -4, 5, 3);
    gfx.fillRect(-12, 2, 5, 3);
    gfx.fillRect(-4, 2, 5, 3);
    gfx.fillRect(4, 2, 5, 3);

    // Orange deck stripe markings
    gfx.lineStyle(1, 0xff8c00, 0.6);
    gfx.lineBetween(-14, -7, -14, 7);
    gfx.lineBetween(12, -7, 12, 7);

    // Bridge/cabin at stern
    gfx.fillStyle(0x455a64, 0.9);
    gfx.fillRect(-17, -4, 5, 8);
    gfx.lineStyle(0.8, 0x78909c, 0.6);
    gfx.strokeRect(-17, -4, 5, 8);

    // Funnel/smokestack
    gfx.fillStyle(0x333333, 0.9);
    gfx.fillRect(-16, -7, 3, 3);
    gfx.fillStyle(0xff8c00, 0.7);
    gfx.fillRect(-16, -7, 3, 1);
  }

  onReachedEnd() {
    this.scene.onTankerScored(this);
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
    const text = this.scene.add.text(wx, wy - 15, `+${ECONOMY.TANKER_BONUS}`, {
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
