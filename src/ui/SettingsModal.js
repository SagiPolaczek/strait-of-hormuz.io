import { SettingsManager } from '../systems/SettingsManager.js';
import { LeaderboardManager } from '../systems/LeaderboardManager.js';

export class SettingsModal {
  constructor(scene, audioManager) {
    this.scene = scene;
    this.audio = audioManager;
    this.isOpen = false;
    this.elements = [];
    this._resetConfirm = false;
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this._resetConfirm = false;
    this._build();
    this.scene.pauseGame();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._destroy();
    this.scene.resumeGame();
  }

  _el(obj) {
    this.elements.push(obj);
    return obj;
  }

  _destroy() {
    this.elements.forEach(el => {
      if (el?.active) {
        this.scene.tweens.killTweensOf(el);
        el.destroy();
      }
    });
    this.elements = [];
  }

  _build() {
    const D = 300;
    const W = 1920, H = 1539;
    const cx = W / 2, cy = H / 2;
    const pw = 520, ph = 480;
    const left = cx - pw / 2, top = cy - ph / 2;

    // ── Dark overlay ──
    this._el(this.scene.add.rectangle(cx, cy, W, H, 0x000000, 0.7)
      .setDepth(D).setScrollFactor(0).setInteractive());

    // ── Panel background ──
    const bg = this._el(this.scene.add.graphics().setDepth(D + 1).setScrollFactor(0));
    bg.fillStyle(0x0a0e14, 0.96);
    bg.fillRoundedRect(left, top, pw, ph, 6);
    bg.lineStyle(2, 0x33ff66, 0.4);
    bg.strokeRoundedRect(left, top, pw, ph, 6);
    // Top accent
    bg.fillStyle(0x33ff66, 0.3);
    bg.fillRect(left, top, pw, 2);
    // Scan lines
    for (let y = top + 3; y < top + ph; y += 3) {
      bg.fillStyle(0x000000, 0.06);
      bg.fillRect(left + 2, y, pw - 4, 1);
    }

    // ── Corner brackets ──
    const corners = this._el(this.scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
    corners.lineStyle(1, 0x33ff66, 0.4);
    const m = 8, cLen = 20;
    // Top-left
    corners.moveTo(left + m, top + m + cLen); corners.lineTo(left + m, top + m); corners.lineTo(left + m + cLen, top + m);
    corners.strokePath(); corners.beginPath();
    // Top-right
    corners.moveTo(left + pw - m - cLen, top + m); corners.lineTo(left + pw - m, top + m); corners.lineTo(left + pw - m, top + m + cLen);
    corners.strokePath(); corners.beginPath();
    // Bottom-left
    corners.moveTo(left + m, top + ph - m - cLen); corners.lineTo(left + m, top + ph - m); corners.lineTo(left + m + cLen, top + ph - m);
    corners.strokePath(); corners.beginPath();
    // Bottom-right
    corners.moveTo(left + pw - m - cLen, top + ph - m); corners.lineTo(left + pw - m, top + ph - m); corners.lineTo(left + pw - m, top + ph - m - cLen);
    corners.strokePath();

    // ── Header ──
    this._el(this.scene.add.text(cx, top + 20, 'SYSTEM SETTINGS', {
      fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66', letterSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(D + 2).setScrollFactor(0).setAlpha(0.5));

    this._el(this.scene.add.text(cx, top + 40, '⚙ CONFIGURATION', {
      fontSize: '28px', fontFamily: '"Black Ops One", cursive',
      color: '#e0e0e0',
    }).setOrigin(0.5, 0).setDepth(D + 2).setScrollFactor(0));

    // Divider
    const hr1 = this._el(this.scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
    hr1.lineStyle(1, 0x33ff66, 0.2);
    hr1.lineBetween(left + 30, top + 80, left + pw - 30, top + 80);

    let rowY = top + 100;

    // ── AUDIO TOGGLE ──
    this._el(this.scene.add.text(left + 40, rowY, 'AUDIO', {
      fontSize: '16px', fontFamily: '"Share Tech Mono", monospace', color: '#90CAF9',
    }).setDepth(D + 2).setScrollFactor(0));

    const soundOn = this.audio?.enabled !== false;
    const soundLabel = soundOn ? 'ON' : 'OFF';
    const soundColor = soundOn ? '#4CAF50' : '#ef5350';

    const soundBtn = this._el(this.scene.add.text(left + pw - 40, rowY, `[ ${soundLabel} ]`, {
      fontSize: '18px', fontFamily: '"Black Ops One", cursive', color: soundColor,
    }).setOrigin(1, 0).setDepth(D + 3).setScrollFactor(0).setInteractive({ useHandCursor: true }));

    soundBtn.on('pointerover', () => soundBtn.setAlpha(0.7));
    soundBtn.on('pointerout', () => soundBtn.setAlpha(1));
    soundBtn.on('pointerdown', () => {
      const nowOn = this.audio.enabled;
      this.audio.enabled = !nowOn;
      soundBtn.setText(nowOn ? '[ OFF ]' : '[ ON ]');
      soundBtn.setColor(nowOn ? '#ef5350' : '#4CAF50');
      this._persist();
    });

    rowY += 55;

    // ── VOLUME SLIDER ──
    this._el(this.scene.add.text(left + 40, rowY, 'VOLUME', {
      fontSize: '16px', fontFamily: '"Share Tech Mono", monospace', color: '#90CAF9',
    }).setDepth(D + 2).setScrollFactor(0));

    const sliderX = left + 40;
    const sliderY = rowY + 35;
    const sliderW = pw - 80;
    const sliderH = 16;

    // Slider track
    const trackGfx = this._el(this.scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
    trackGfx.fillStyle(0x1a1a1a, 0.9);
    trackGfx.fillRoundedRect(sliderX, sliderY, sliderW, sliderH, 3);
    trackGfx.lineStyle(1, 0xffb300, 0.3);
    trackGfx.strokeRoundedRect(sliderX, sliderY, sliderW, sliderH, 3);

    // Slider fill
    const fillGfx = this._el(this.scene.add.graphics().setDepth(D + 2.5).setScrollFactor(0));
    const currentVol = this.audio?.volume || 0.3;

    const drawFill = (vol) => {
      fillGfx.clear();
      const fw = Math.max(4, (sliderW - 4) * vol);
      fillGfx.fillStyle(0xffb300, 0.8);
      fillGfx.fillRoundedRect(sliderX + 2, sliderY + 2, fw, sliderH - 4, 2);
      fillGfx.fillStyle(0xffffff, 0.15);
      fillGfx.fillRect(sliderX + 2, sliderY + 2, fw, 3);
    };
    drawFill(currentVol);

    // Volume % text
    const volText = this._el(this.scene.add.text(left + pw - 40, rowY, `${Math.round(currentVol * 100)}%`, {
      fontSize: '16px', fontFamily: '"Orbitron", sans-serif', color: '#ffb300',
    }).setOrigin(1, 0).setDepth(D + 2).setScrollFactor(0));

    // Slider hit area
    const sliderHit = this._el(this.scene.add.rectangle(
      sliderX + sliderW / 2, sliderY + sliderH / 2,
      sliderW, sliderH + 20, 0x000000, 0
    ).setDepth(D + 3).setScrollFactor(0).setInteractive({ useHandCursor: true }));

    sliderHit.on('pointerdown', (pointer) => {
      const vol = Math.max(0, Math.min(1, (pointer.x - sliderX) / sliderW));
      this.audio.volume = vol;
      drawFill(vol);
      volText.setText(`${Math.round(vol * 100)}%`);
      this._persist();
    });
    sliderHit.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const vol = Math.max(0, Math.min(1, (pointer.x - sliderX) / sliderW));
      this.audio.volume = vol;
      drawFill(vol);
      volText.setText(`${Math.round(vol * 100)}%`);
    });
    sliderHit.on('pointerup', () => this._persist());

    rowY += 75;

    // Divider
    const hr2 = this._el(this.scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
    hr2.lineStyle(1, 0x33ff66, 0.15);
    hr2.lineBetween(left + 30, rowY, left + pw - 30, rowY);

    rowY += 20;

    // ── RESET LEADERBOARD ──
    this._el(this.scene.add.text(left + 40, rowY, 'LEADERBOARD', {
      fontSize: '16px', fontFamily: '"Share Tech Mono", monospace', color: '#90CAF9',
    }).setDepth(D + 2).setScrollFactor(0));

    const resetBtn = this._el(this.scene.add.text(left + pw - 40, rowY, '[ RESET ]', {
      fontSize: '16px', fontFamily: '"Black Ops One", cursive', color: '#ef5350',
    }).setOrigin(1, 0).setDepth(D + 3).setScrollFactor(0).setInteractive({ useHandCursor: true }));

    resetBtn.on('pointerover', () => resetBtn.setAlpha(0.7));
    resetBtn.on('pointerout', () => { resetBtn.setAlpha(1); });
    resetBtn.on('pointerdown', () => {
      if (!this._resetConfirm) {
        this._resetConfirm = true;
        resetBtn.setText('[ CONFIRM? ]').setColor('#ff1744');
        this.scene.time.delayedCall(3000, () => {
          if (this._resetConfirm && resetBtn?.active) {
            this._resetConfirm = false;
            resetBtn.setText('[ RESET ]').setColor('#ef5350');
          }
        });
      } else {
        LeaderboardManager.clear();
        this._resetConfirm = false;
        resetBtn.setText('[ CLEARED ✓ ]').setColor('#4CAF50');
        this.scene.time.delayedCall(1500, () => {
          if (resetBtn?.active) resetBtn.setText('[ RESET ]').setColor('#ef5350');
        });
      }
    });

    rowY += 60;

    // Divider
    const hr3 = this._el(this.scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
    hr3.lineStyle(1, 0x33ff66, 0.15);
    hr3.lineBetween(left + 30, rowY, left + pw - 30, rowY);

    rowY += 15;

    // ── CONTROLS HINT ──
    this._el(this.scene.add.text(cx, rowY, 'CONTROLS', {
      fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66', letterSpacing: 3,
    }).setOrigin(0.5, 0).setDepth(D + 2).setScrollFactor(0).setAlpha(0.5));

    rowY += 20;
    const controls = [
      '1-4 ........... SELECT UNIT',
      'CLICK MAP ..... PLACE / UPGRADE',
      'T T T ......... TRUMP EVENT',
      'ESC ........... SETTINGS',
    ];
    controls.forEach((line, i) => {
      this._el(this.scene.add.text(cx, rowY + i * 22, line, {
        fontSize: '13px', fontFamily: '"Share Tech Mono", monospace', color: '#777777',
      }).setOrigin(0.5, 0).setDepth(D + 2).setScrollFactor(0));
    });

    // ── CLOSE BUTTON ──
    const closeBtn = this._el(this.scene.add.text(cx, top + ph - 40, '[ CLOSE — ESC ]', {
      fontSize: '20px', fontFamily: '"Black Ops One", cursive', color: '#33ff66',
    }).setOrigin(0.5).setDepth(D + 3).setScrollFactor(0).setInteractive({ useHandCursor: true }));

    closeBtn.on('pointerover', () => closeBtn.setColor('#66ff99'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#33ff66'));
    closeBtn.on('pointerdown', () => this.close());

    // ── PAUSED label at top ──
    const pausedText = this._el(this.scene.add.text(cx, top - 30, '▌▌ PAUSED', {
      fontSize: '24px', fontFamily: '"Black Ops One", cursive', color: '#ffb300',
    }).setOrigin(0.5).setDepth(D + 2).setScrollFactor(0));

    this.scene.tweens.add({
      targets: pausedText, alpha: { from: 1, to: 0.4 },
      duration: 800, yoyo: true, repeat: -1,
    });
  }

  _persist() {
    SettingsManager.save({
      soundEnabled: this.audio.enabled,
      volume: this.audio.volume,
    });
  }
}
