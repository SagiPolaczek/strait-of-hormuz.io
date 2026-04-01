import Phaser from 'phaser';
import { ECONOMY } from '../config/constants.js';

// Ensure shared particle textures exist
function ensureTextures(scene) {
  if (!scene.textures.exists('flare')) {
    const c = scene.textures.createCanvas('flare', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!scene.textures.exists('smoke')) {
    const c = scene.textures.createCanvas('smoke', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(120,120,120,0.8)');
    g.addColorStop(0.5, 'rgba(80,80,80,0.4)');
    g.addColorStop(1, 'rgba(40,40,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
  if (!scene.textures.exists('fire')) {
    const c = scene.textures.createCanvas('fire', 16, 16);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255,200,50,1)');
    g.addColorStop(0.4, 'rgba(255,100,20,0.8)');
    g.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    c.refresh();
  }
}

export class OilRig extends Phaser.GameObjects.Container {
  constructor(scene, x, y, side, stats) {
    super(scene, x, y);
    this.scene = scene;
    this.side = side;
    this.stats = stats;
    this.hp = stats.hp;

    ensureTextures(scene);

    // Tap-to-collect state (coalition only)
    this.storedOil = 0;
    this.maxStorage = ECONOMY.OIL_RIG_MAX_STORAGE;

    const isCoalition = side === 'coalition';
    const primaryColor = isCoalition ? 0x2196f3 : 0xf44336;
    const accentColor = isCoalition ? 0x64b5f6 : 0xff7043;
    const darkColor = isCoalition ? 0x1565c0 : 0xc62828;

    // --- Draw the rig using graphics ---
    this.gfx = scene.add.graphics();

    // Platform base (dark rectangle)
    this.gfx.fillStyle(0x333333, 0.9);
    this.gfx.fillRect(-18, 4, 36, 10);
    this.gfx.lineStyle(1.5, primaryColor, 0.8);
    this.gfx.strokeRect(-18, 4, 36, 10);

    // Support legs into water
    this.gfx.lineStyle(2, 0x555555, 0.8);
    this.gfx.lineBetween(-14, 14, -18, 26);
    this.gfx.lineBetween(14, 14, 18, 26);
    this.gfx.lineBetween(-4, 14, -6, 26);
    this.gfx.lineBetween(4, 14, 6, 26);

    // Derrick tower (triangular structure)
    this.gfx.lineStyle(2, accentColor, 0.9);
    this.gfx.beginPath();
    this.gfx.moveTo(-10, 4);
    this.gfx.lineTo(0, -22);
    this.gfx.lineTo(10, 4);
    this.gfx.strokePath();

    // Cross braces on tower
    this.gfx.lineStyle(1, accentColor, 0.5);
    this.gfx.lineBetween(-6, -3, 6, -3);
    this.gfx.lineBetween(-8, -9, 8, -9);
    this.gfx.lineBetween(-4, -15, 4, -15);

    // Small platform on top of derrick
    this.gfx.fillStyle(primaryColor, 0.8);
    this.gfx.fillRect(-3, -24, 6, 3);

    // Pump arm (animated)
    this.pumpArm = scene.add.graphics();
    this.pumpArm.lineStyle(2.5, darkColor, 0.9);
    this.pumpArm.lineBetween(0, 0, 12, -6);
    this.pumpArm.fillStyle(darkColor, 1);
    this.pumpArm.fillCircle(12, -6, 2.5);
    this.pumpArm.x = 12;
    this.pumpArm.y = 2;

    // Animate pump arm rocking
    scene.tweens.add({
      targets: this.pumpArm,
      angle: { from: -8, to: 8 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Pulsing glow ring (oil generation indicator)
    this.glowRing = scene.add.graphics();
    this.glowRing.lineStyle(2, primaryColor, 0.3);
    this.glowRing.strokeCircle(0, 0, 28);
    this.glowRingAlpha = 0.3;

    scene.tweens.add({
      targets: this,
      glowRingAlpha: { from: 0.1, to: 0.5 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (this.glowRing && this.glowRing.active) {
          this.glowRing.clear();
          this.glowRing.lineStyle(2, primaryColor, this.glowRingAlpha);
          this.glowRing.strokeCircle(0, 0, 28);
        }
      },
    });

    this.add([this.glowRing, this.gfx, this.pumpArm]);

    // HP bar with border
    this.hpBarBg = scene.add.rectangle(0, -30, 40, 5, 0x000000, 0.5).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(-18, -30, 36, 3, 0x4caf50).setOrigin(0, 0.5);
    this.hpBarBorder = scene.add.graphics();
    this.hpBarBorder.lineStyle(1, 0xffffff, 0.4);
    this.hpBarBorder.strokeRect(-20, -32.5, 40, 5);
    this.add([this.hpBarBg, this.hpBar, this.hpBarBorder]);

    // Oil storage fill indicator (coalition only — shows stored oil level)
    if (isCoalition) {
      this.storageBg = scene.add.rectangle(0, 18, 30, 4, 0x1a1a1a, 0.8).setOrigin(0.5);
      this.storageBg.setStrokeStyle(1, 0xffb300, 0.4);
      this.storageFill = scene.add.rectangle(-14, 18, 0, 2, 0xffb300, 0.9).setOrigin(0, 0.5);
      this.storageLabel = scene.add.text(0, 26, '', {
        fontSize: '9px', fontFamily: '"Share Tech Mono", monospace',
        color: '#ffb300', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0);
      this.add([this.storageBg, this.storageFill, this.storageLabel]);

      // Pulsing "COLLECT" prompt when storage is above 50%
      this.collectPrompt = scene.add.text(0, -40, '⬇ TAP', {
        fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
        color: '#ffb300', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0).setDepth(15);
      this.add(this.collectPrompt);
    }

    scene.add.existing(this);
  }

  // Called by EconomyManager each tick — accumulate oil internally
  addStoredOil(amount) {
    if (this.side !== 'coalition') return;
    this.storedOil = Math.min(this.storedOil + amount, this.maxStorage);
    this._updateStorageVisual();
  }

  _updateStorageVisual() {
    if (!this.storageFill || !this.storageFill.active) return;
    const pct = this.storedOil / this.maxStorage;
    this.storageFill.width = 28 * pct;

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
            y: -42,
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
    this.scene.time.delayedCall(800, () => { if (burst && burst.active) burst.destroy(); });

    // Flash the rig bright
    if (this.gfx && this.gfx.active) {
      this.scene.tweens.add({
        targets: this.gfx,
        alpha: { from: 1.5, to: 1 },
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
    this.hpBar.width = 36 * pct;
    this.hpBar.fillColor = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffeb3b : 0xf44336;

    // Flash on damage
    if (this.gfx && this.gfx.active) {
      this.scene.tweens.add({
        targets: this.gfx,
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
      if (fire && fire.active) fire.destroy();
      if (smoke && smoke.active) smoke.destroy();
    });
  }

  destroy(fromScene) {
    if (this.oilTextTimer) {
      this.oilTextTimer.remove(false);
      this.oilTextTimer = null;
    }
    super.destroy(fromScene);
  }
}
