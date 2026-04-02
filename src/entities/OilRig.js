import Phaser from 'phaser';
import { ECONOMY } from '../config/constants.js';
import { ensureTextures } from '../utils/textures.js';
import { getMaxStorage as calcStorage } from '../utils/calculations.js';

export class OilRig extends Phaser.GameObjects.Container {
  constructor(scene, x, y, side, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.side = side;
    this.stats = stats;
    this.hp = stats.hp;
    this._timers = [];

    ensureTextures(scene);

    // Tap-to-collect state (coalition only)
    this.storedOil = 0;
    this.maxStorage = ECONOMY.OIL_RIG_MAX_STORAGE;
    this.upgrades = side === 'coalition' ? { STORAGE: 0, DRILL_RATE: 0 } : {};

    const isCoalition = side === 'coalition';
    const primaryColor = isCoalition ? 0x2196f3 : 0xf44336;

    // --- Sprite-based rig ---
    const rigTexture = isCoalition ? 'spr_oil_rig' : 'spr_oil_rig_irgc';
    this.rigSprite = scene.add.image(0, 0, rigTexture).setOrigin(0.5).setScale(1.3);

    // Subtle breathing alpha tween
    scene.tweens.add({
      targets: this.rigSprite,
      alpha: { from: 1, to: 0.85 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Pulsing glow ring (oil generation indicator)
    this.glowRing = scene.add.graphics();
    this.glowRing.lineStyle(2, primaryColor, 1.0);
    this.glowRing.strokeCircle(0, 0, 36);
    this.glowRing.setAlpha(0.1);
    scene.tweens.add({
      targets: this.glowRing,
      alpha: { from: 0.1, to: 0.5 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add([this.glowRing, this.rigSprite]);

    // HP bar with border
    this.hpBarBg = scene.add.rectangle(0, -39, 52, 5, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-24, -39, 47, 3, 0x4caf50).setOrigin(0, 0.5);
    this.hpBarBorder = scene.add.graphics();
    this.hpBarBorder.lineStyle(1, 0xffffff, 0.4);
    this.hpBarBorder.strokeRect(-26, -41.5, 52, 5);
    this.add([this.hpBarBg, this.hpBar, this.hpBarBorder]);

    // Income upgrade indicator (coalition only — shows reserves level)
    if (isCoalition) {
      const reserveLvl = this.upgrades?.STORAGE || 0;
      if (reserveLvl > 0) {
        this.reserveLabel = scene.add.text(0, 28, `+${reserveLvl * 20}%`, {
          fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
          color: '#ffb300', fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0.6);
        this.add(this.reserveLabel);
      }
    }

    scene.add.existing(this);
  }

  getMaxStorage() {
    return calcStorage(this.maxStorage, this.upgrades?.STORAGE || 0);
  }

  getMaxHP() {
    return this.stats.hp;
  }

  applyUpgrade(key) {
    if (!this.upgrades) this.upgrades = {};
    this.upgrades[key] = (this.upgrades[key] || 0) + 1;
    if (key === 'STORAGE') this._updateReserveLabel();
  }

  _updateReserveLabel() {
    const lvl = this.upgrades?.STORAGE || 0;
    if (lvl > 0 && !this.reserveLabel && this.scene) {
      this.reserveLabel = this.scene.add.text(0, 28, '', {
        fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
        color: '#ffb300', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.6);
      this.add(this.reserveLabel);
    }
    if (this.reserveLabel) this.reserveLabel.setText(`+${lvl * 20}%`);
  }

  // Stream animation: golden dots float up + income text
  emitOilStream(amount) {
    if (this.side !== 'coalition' || !this.scene) return;

    // 3-4 golden dots per tick, larger and more visible
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const dot = this.scene.add.circle(
        this.x + (Math.random() - 0.5) * 20,
        this.y - 34 - Math.random() * 6,
        3.5 + Math.random() * 2.5,
        0xFFD54F,
        0.9
      ).setDepth(6);
      this.scene.tweens.add({
        targets: dot,
        y: dot.y - 30 - Math.random() * 20,
        x: dot.x + (Math.random() - 0.5) * 14,
        alpha: 0,
        scale: 0.2,
        duration: 600 + Math.random() * 400,
        delay: i * 60,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }

    // Floating "+K" income text (throttled to every 3rd tick to avoid spam)
    if (!this._incomeTextCooldown || this.scene.time.now > this._incomeTextCooldown) {
      this._incomeTextCooldown = this.scene.time.now + 3000;
      const txt = this.scene.add.text(this.x, this.y - 48, `+${Math.floor(amount)}`, {
        fontSize: '13px', fontFamily: '"Orbitron", sans-serif',
        fontStyle: 'bold', color: '#FFD54F',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(15).setAlpha(0);

      this.scene.tweens.add({
        targets: txt,
        alpha: { from: 0, to: 0.9 },
        y: txt.y - 25,
        duration: 600,
        ease: 'Quad.easeOut',
      });
      this.scene.tweens.add({
        targets: txt,
        alpha: 0,
        y: txt.y - 50,
        duration: 500,
        delay: 600,
        ease: 'Quad.easeIn',
        onComplete: () => txt.destroy(),
      });
    }
  }

  // Called by EconomyManager each tick — accumulate oil internally
  addStoredOil(amount) {
    if (this.side !== 'coalition') return;
    this.storedOil = Math.min(this.storedOil + amount, this.getMaxStorage());
    this._updateStorageVisual();
  }

  // Called when player clicks to collect — triggers the juicy effect
  showCollectionEffect(amount) {
    if (!this.scene) return;
    const wx = this.x;
    const wy = this.y;

    // Golden splash text
    const text = this.scene.add.text(wx, wy - 25, `+${amount} 🛢️`, {
      fontSize: '22px',
      fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold',
      color: '#FFD54F',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
      targets: text,
      y: wy - 70,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });

    // Golden particle burst
    const burst = this.scene.add.particles(wx, wy - 10, 'flare', {
      speed: { min: 40, max: 100 },
      angle: { min: 230, max: 310 },
      scale: { start: 0.6, end: 0 },
      lifespan: 700,
      tint: 0xFFD54F,
      quantity: 8,
      emitting: false,
    });
    burst.setDepth(22);
    burst.explode(8);
    this.scene.time.delayedCall(800, () => {
      if (!this.scene || !this.scene.sys?.isActive()) return;
      if (burst && burst.active) burst.destroy();
    });

    // Flash the rig bright
    if (this.rigSprite && this.rigSprite.active) {
      this.scene.tweens.add({
        targets: this.rigSprite,
        alpha: { from: 1, to: 0.7 },
        duration: 200,
      });
    }

    // Expanding golden ring
    const ring = this.scene.add.circle(wx, wy, 10, 0xFFD54F, 0.4).setDepth(20);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 3, scaleY: 3, alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  takeDamage(amount) {
    this.hp -= amount;
    const pct = Math.max(0, this.hp / this.stats.hp);
    this.hpBar.width = 47 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    // Flash on damage
    if (this.rigSprite && this.rigSprite.active) {
      this.scene.tweens.add({
        targets: this.rigSprite,
        alpha: { from: 0.3, to: 1 },
        duration: 120,
        yoyo: true,
        repeat: 1,
      });
    }

    if (this.hp <= 0) {
      this._onDestroyed();
      this.destroy();
      return true;
    }
    return false;
  }

  _onDestroyed() {
    if (!this.scene) return;
    const wx = this.x;
    const wy = this.y;

    // Cancel oil text timer
    if (this.oilTextTimer) this.oilTextTimer.remove(false);

    // Fire burst
    const fire = this.scene.add.particles(wx, wy, 'fire', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: { min: 400, max: 900 },
      quantity: 12,
      emitting: false,
    });
    fire.setDepth(20);
    fire.explode(12);

    // Smoke burst
    const smoke = this.scene.add.particles(wx, wy, 'smoke', {
      speed: { min: 15, max: 60 },
      angle: { min: 240, max: 300 },
      scale: { start: 1.2, end: 0.2 },
      lifespan: { min: 600, max: 1400 },
      quantity: 8,
      emitting: false,
    });
    smoke.setDepth(19);
    smoke.explode(8);

    // Flash ring
    const flash = this.scene.add.circle(wx, wy, 5, 0xffffff, 0.9).setDepth(21);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Cleanup particles after delay
    this.scene.time.delayedCall(1500, () => {
      if (!this.scene || !this.scene.sys?.isActive()) return;
      if (fire && fire.active) fire.destroy();
      if (smoke && smoke.active) smoke.destroy();
    });
  }

  destroy(fromScene) {
    if (this.oilTextTimer) {
      this.oilTextTimer.remove(false);
      this.oilTextTimer = null;
    }
    if (this.reserveLabel?.active) this.reserveLabel.destroy();
    this.reserveLabel = null;
    this._timers.forEach(t => { if (t) t.remove(false); });
    this._timers = [];
    super.destroy(fromScene);
  }
}
