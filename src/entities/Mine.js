import Phaser from 'phaser';

export class Mine extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.scene = scene;
    this.hp = 20;
    this.damage = 90;
    this.detectRadius = 80;
    this.triggerRadius = 22;
    this.detected = false;
    this.detonated = false;
    this.isMine = true;

    // Warning visual (hidden until detected)
    this.mineSprite = scene.add.image(0, 0, 'spr_mine').setOrigin(0.5).setAlpha(0);
    this.add(this.mineSprite);
    this.warningText = null;

    scene.add.existing(this);
    this.setDepth(1);
  }

  update() {
    if (this.detonated || !this.active) return;

    const ships = this.scene.coalitionShips?.getChildren() || [];
    for (const ship of ships) {
      if (!ship.active || !ship.alive || ship.isSubmerged) continue;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, ship.x, ship.y);

      if (!this.detected && dist < this.detectRadius) {
        this.detected = true;
        this._showWarning();
      }

      if (dist < this.triggerRadius) {
        this._detonate(ship);
        return;
      }
    }
  }

  _showWarning() {
    if (this._warned) return;
    this._warned = true;
    this.mineSprite.setAlpha(1);
    this.scene.tweens.add({
      targets: this.mineSprite,
      alpha: { from: 1, to: 0.4 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
    this.warningText = this.scene.add.text(this.x, this.y - 20, '⚠ MINE', {
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#ef5350',
    }).setOrigin(0.5).setDepth(10);
  }

  _detonate(ship) {
    this.detonated = true;
    const wx = this.x, wy = this.y;
    ship.takeDamage(this.damage);

    // Water column explosion
    if (this.scene.textures.exists('fire')) {
      const fire = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 80, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0 },
        lifespan: { min: 400, max: 1000 },
        quantity: 20,
        emitting: false,
      });
      fire.setDepth(20);
      fire.explode(20);
      this.scene.time.delayedCall(1200, () => { if (fire?.active) fire.destroy(); });
    }

    // White flash
    const flash = this.scene.add.circle(wx, wy, 8, 0xffffff, 0.9).setDepth(21);
    this.scene.tweens.add({
      targets: flash, scaleX: 6, scaleY: 6, alpha: 0,
      duration: 500, ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Shockwave ring
    const ring = this.scene.add.graphics().setDepth(19);
    ring.x = wx; ring.y = wy;
    this.scene.tweens.add({
      targets: ring, alpha: 0, duration: 600,
      onUpdate: (tween) => {
        const r = 10 + tween.progress * 60;
        ring.clear();
        ring.lineStyle(3 - tween.progress * 2.5, 0x64b5f6, 0.8 - tween.progress * 0.8);
        ring.strokeCircle(0, 0, r);
      },
      onComplete: () => ring.destroy(),
    });

    // Damage text
    const dmg = this.scene.add.text(wx, wy - 25, `💥 MINE -${this.damage}`, {
      fontSize: '18px', fontFamily: '"Black Ops One", cursive',
      color: '#ff4444', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({
      targets: dmg, y: wy - 60, alpha: 0, duration: 1000,
      onComplete: () => dmg.destroy(),
    });

    if (this.warningText) this.warningText.destroy();
    this.destroy();
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.detonated = true;
      const wx = this.x, wy = this.y;
      const puff = this.scene.add.circle(wx, wy, 5, 0xffcc00, 0.6).setDepth(10);
      this.scene.tweens.add({
        targets: puff, scaleX: 3, scaleY: 3, alpha: 0,
        duration: 300, onComplete: () => puff.destroy(),
      });
      const txt = this.scene.add.text(wx, wy - 15, '✓ CLEARED', {
        fontSize: '11px', fontFamily: '"Share Tech Mono", monospace',
        color: '#4CAF50', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(10);
      this.scene.tweens.add({
        targets: txt, y: wy - 35, alpha: 0, duration: 600,
        onComplete: () => txt.destroy(),
      });
      if (this.warningText) this.warningText.destroy();
      this.destroy();
      return true;
    }
    return false;
  }

  destroy(fromScene) {
    if (this.warningText && this.warningText.active) {
      this.warningText.destroy();
      this.warningText = null;
    }
    if (this.mineSprite) {
      this.scene?.tweens?.killTweensOf(this.mineSprite);
    }
    super.destroy(fromScene);
  }
}
