import Phaser from 'phaser';
import { ECONOMY } from '../config/constants.js';
import { ensureTextures } from '../utils/textures.js';

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

    // Oil storage fill indicator (coalition only — shows stored oil level)
    if (isCoalition) {
      this.storageBg = scene.add.rectangle(0, 24, 39, 5, 0x1a1a1a, 0.8).setOrigin(0.5);
      this.storageBg.setStrokeStyle(1, 0xffb300, 0.4);
      this.storageFill = scene.add.rectangle(-18, 24, 0, 3, 0xffb300, 0.9).setOrigin(0, 0.5);
      this.storageLabel = scene.add.text(0, 34, '', {
        fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
        color: '#ffb300', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0);
      this.add([this.storageBg, this.storageFill, this.storageLabel]);

      // Pulsing "COLLECT" prompt when storage is above 50%
      this.collectPrompt = scene.add.text(0, -52, '⬇ TAP', {
        fontSize: '11px', fontFamily: '"Share Tech Mono", monospace',
        color: '#ffb300', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0).setDepth(15);
      this.add(this.collectPrompt);
    }

    scene.add.existing(this);
  }

  getMaxStorage() {
    return this.maxStorage * (1 + 0.5 * (this.upgrades?.STORAGE || 0));
  }

  getMaxHP() {
    return this.stats.hp;
  }

  applyUpgrade(key) {
    if (!this.upgrades) this.upgrades = {};
    this.upgrades[key] = (this.upgrades[key] || 0) + 1;
    if (key === 'STORAGE') this._updateStorageVisual();
  }

  // Called by EconomyManager each tick — accumulate oil internally
  addStoredOil(amount) {
    if (this.side !== 'coalition') return;
    this.storedOil = Math.min(this.storedOil + amount, this.getMaxStorage());
    this._updateStorageVisual();
  }

  _updateStorageVisual() {
    if (!this.storageFill || !this.storageFill.active) return;
    const pct = this.storedOil / this.getMaxStorage();
    this.storageFill.width = 36 * pct;

    // Color shifts: amber → gold → pulsing when full
    this.storageFill.fillColor = pct >= 1 ? 0xff6600 : pct > 0.5 ? 0xffc107 : 0xffb300;

    // Show amount label when there's stored oil
    if (this.storedOil > 0) {
      this.storageLabel.setText(`${Math.floor(this.storedOil)}`).setAlpha(0.7);
    } else {
      this.storageLabel.setAlpha(0);
    }

    // Show/pulse "TAP" prompt when storage is above 50%
    if (this.collectPrompt) {
      if (pct >= 0.5) {
        this.collectPrompt.setAlpha(0.8);
        if (!this._collectPulseTween) {
          this._collectPulseTween = this.scene.tweens.add({
            targets: this.collectPrompt,
            alpha: { from: 0.8, to: 0.3 },
            y: -55,
            duration: 600,
            yoyo: true,
            repeat: -1,
          });
        }
      } else {
        this.collectPrompt.setAlpha(0);
        if (this._collectPulseTween) {
          this._collectPulseTween.destroy();
          this._collectPulseTween = null;
        }
      }
    }
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
    if (this._collectPulseTween) {
      this._collectPulseTween.destroy();
      this._collectPulseTween = null;
    }
    if (this.oilTextTimer) {
      this.oilTextTimer.remove(false);
      this.oilTextTimer = null;
    }
    this._timers.forEach(t => { if (t) t.remove(false); });
    this._timers = [];
    super.destroy(fromScene);
  }
}
