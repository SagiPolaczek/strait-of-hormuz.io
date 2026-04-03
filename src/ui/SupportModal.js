import { SOCIAL } from '../config/constants.js';

const STORAGE_KEY = 'hormuz_support_shown';

export class SupportModal {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.elements = [];
  }

  /** Schedule the modal to appear after delayMs (skips if already shown) */
  schedule(delayMs = 120000) {
    if (localStorage.getItem(STORAGE_KEY)) return;
    this._timer = this.scene.time.delayedCall(delayMs, () => this.open());
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    localStorage.setItem(STORAGE_KEY, '1');
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
    const scene = this.scene;
    const D = 310; // above settings modal (300)
    const W = 1920, H = 1539;
    const cx = W / 2, cy = H / 2;
    const pw = 560, ph = 420;
    const left = cx - pw / 2, top = cy - ph / 2;

    // ── Dark overlay ──
    const overlay = this._el(scene.add.rectangle(cx, cy, W, H, 0x000000, 0)
      .setDepth(D).setScrollFactor(0).setInteractive());
    scene.tweens.add({ targets: overlay, fillAlpha: 0.8, duration: 400 });

    // ── Incoming transmission flicker ──
    const flashRect = this._el(scene.add.rectangle(cx, cy, W, H, 0x33ff66, 0)
      .setDepth(D + 0.5).setScrollFactor(0));
    scene.tweens.add({
      targets: flashRect,
      fillAlpha: { from: 0.08, to: 0 },
      duration: 120,
      repeat: 2,
      onComplete: () => flashRect.destroy(),
    });

    // ── Panel background ──
    const bg = this._el(scene.add.graphics().setDepth(D + 1).setScrollFactor(0));
    bg.fillStyle(0x0a0e14, 0.97);
    bg.fillRoundedRect(left, top, pw, ph, 6);
    bg.lineStyle(2, 0xffb300, 0.5);
    bg.strokeRoundedRect(left, top, pw, ph, 6);
    // Top accent bar (amber)
    bg.fillStyle(0xffb300, 0.5);
    bg.fillRect(left, top, pw, 2);
    // Scan lines
    for (let y = top + 3; y < top + ph; y += 3) {
      bg.fillStyle(0x000000, 0.06);
      bg.fillRect(left + 2, y, pw - 4, 1);
    }
    bg.setAlpha(0);
    scene.tweens.add({ targets: bg, alpha: 1, duration: 300, delay: 200 });

    // ── Corner brackets ──
    const corners = this._el(scene.add.graphics().setDepth(D + 2).setScrollFactor(0));
    corners.lineStyle(1, 0xffb300, 0.5);
    const m = 8, cLen = 20;
    corners.moveTo(left + m, top + m + cLen); corners.lineTo(left + m, top + m); corners.lineTo(left + m + cLen, top + m);
    corners.strokePath(); corners.beginPath();
    corners.moveTo(left + pw - m - cLen, top + m); corners.lineTo(left + pw - m, top + m); corners.lineTo(left + pw - m, top + m + cLen);
    corners.strokePath(); corners.beginPath();
    corners.moveTo(left + m, top + ph - m - cLen); corners.lineTo(left + m, top + ph - m); corners.lineTo(left + m + cLen, top + ph - m);
    corners.strokePath(); corners.beginPath();
    corners.moveTo(left + pw - m - cLen, top + ph - m); corners.lineTo(left + pw - m, top + ph - m); corners.lineTo(left + pw - m, top + ph - m - cLen);
    corners.strokePath();
    corners.setAlpha(0);
    scene.tweens.add({ targets: corners, alpha: 1, duration: 300, delay: 200 });

    // ── "INCOMING TRANSMISSION" header ──
    const incomingLabel = this._el(scene.add.text(cx, top + 20, '◆ INCOMING TRANSMISSION ◆', {
      fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
      color: '#ffb300', letterSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(D + 2).setScrollFactor(0).setAlpha(0));

    scene.tweens.add({ targets: incomingLabel, alpha: 0.7, duration: 300, delay: 400 });
    scene.tweens.add({
      targets: incomingLabel, alpha: { from: 0.7, to: 0.35 },
      duration: 900, yoyo: true, repeat: -1, delay: 800,
    });

    // ── Title ──
    const title = this._el(scene.add.text(cx, top + 48, 'SUPPORT THE MISSION', {
      fontSize: '28px', fontFamily: '"Black Ops One", cursive', color: '#e0e0e0',
    }).setOrigin(0.5, 0).setDepth(D + 2).setScrollFactor(0).setAlpha(0));
    scene.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 500 });

    // ── Divider ──
    const hr = this._el(scene.add.graphics().setDepth(D + 2).setScrollFactor(0).setAlpha(0));
    hr.lineStyle(1, 0xffb300, 0.25);
    hr.lineBetween(left + 30, top + 88, left + pw - 30, top + 88);
    scene.tweens.add({ targets: hr, alpha: 1, duration: 300, delay: 550 });

    // ── Body text ──
    const bodyText = this._el(scene.add.text(cx, top + 105, 'This operation runs on zero budget.\nIf you\'re having fun, a quick star or follow\ngoes a long way, Admiral.', {
      fontSize: '14px', fontFamily: '"Share Tech Mono", monospace',
      color: '#90CAF9', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0).setDepth(D + 2).setScrollFactor(0).setAlpha(0));
    scene.tweens.add({ targets: bodyText, alpha: 0.9, duration: 400, delay: 650 });

    // ── GitHub button ──
    const ghBtnY = top + 210;
    const ghBtnW = 360, ghBtnH = 52;

    const ghBg = this._el(scene.add.graphics().setDepth(D + 2).setScrollFactor(0).setAlpha(0));
    ghBg.fillStyle(0x1a1a2e, 0.9);
    ghBg.fillRoundedRect(cx - ghBtnW / 2, ghBtnY - ghBtnH / 2, ghBtnW, ghBtnH, 4);
    ghBg.lineStyle(1.5, 0xe0e0e0, 0.4);
    ghBg.strokeRoundedRect(cx - ghBtnW / 2, ghBtnY - ghBtnH / 2, ghBtnW, ghBtnH, 4);

    const ghIconImg = this._el(scene.add.image(cx - 120, ghBtnY, 'spr_github_icon')
      .setDepth(D + 3).setScrollFactor(0).setAlpha(0));

    const ghText = this._el(scene.add.text(cx - 90, ghBtnY, '★  STAR ON GITHUB', {
      fontSize: '16px', fontFamily: '"Black Ops One", cursive', color: '#e0e0e0',
    }).setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0).setAlpha(0));

    const ghHit = this._el(scene.add.rectangle(cx, ghBtnY, ghBtnW, ghBtnH, 0x000000, 0)
      .setDepth(D + 4).setScrollFactor(0).setInteractive({ useHandCursor: true }).setAlpha(0.001));

    // Hover glow graphics (redrawn on hover)
    const ghHoverGfx = this._el(scene.add.graphics().setDepth(D + 1.5).setScrollFactor(0).setAlpha(0));

    ghHit.on('pointerover', () => {
      ghText.setColor('#ffffff');
      ghHoverGfx.clear();
      ghHoverGfx.fillStyle(0xffffff, 0.06);
      ghHoverGfx.fillRoundedRect(cx - ghBtnW / 2, ghBtnY - ghBtnH / 2, ghBtnW, ghBtnH, 4);
      ghHoverGfx.setAlpha(1);
    });
    ghHit.on('pointerout', () => {
      ghText.setColor('#e0e0e0');
      ghHoverGfx.setAlpha(0);
    });
    ghHit.on('pointerdown', () => window.open(SOCIAL.GITHUB_URL, '_blank'));

    scene.tweens.add({
      targets: [ghBg, ghIconImg, ghText],
      alpha: 1, duration: 400, delay: 800,
    });

    // ── X / Twitter button ──
    const xBtnY = ghBtnY + 70;

    const xBg = this._el(scene.add.graphics().setDepth(D + 2).setScrollFactor(0).setAlpha(0));
    xBg.fillStyle(0x1a1a2e, 0.9);
    xBg.fillRoundedRect(cx - ghBtnW / 2, xBtnY - ghBtnH / 2, ghBtnW, ghBtnH, 4);
    xBg.lineStyle(1.5, 0xe0e0e0, 0.4);
    xBg.strokeRoundedRect(cx - ghBtnW / 2, xBtnY - ghBtnH / 2, ghBtnW, ghBtnH, 4);

    const xIconImg = this._el(scene.add.image(cx - 120, xBtnY, 'spr_x_icon')
      .setDepth(D + 3).setScrollFactor(0).setAlpha(0));

    const xText = this._el(scene.add.text(cx - 90, xBtnY, '♦  FOLLOW ON X', {
      fontSize: '16px', fontFamily: '"Black Ops One", cursive', color: '#e0e0e0',
    }).setOrigin(0, 0.5).setDepth(D + 3).setScrollFactor(0).setAlpha(0));

    const xHit = this._el(scene.add.rectangle(cx, xBtnY, ghBtnW, ghBtnH, 0x000000, 0)
      .setDepth(D + 4).setScrollFactor(0).setInteractive({ useHandCursor: true }).setAlpha(0.001));

    const xHoverGfx = this._el(scene.add.graphics().setDepth(D + 1.5).setScrollFactor(0).setAlpha(0));

    xHit.on('pointerover', () => {
      xText.setColor('#ffffff');
      xHoverGfx.clear();
      xHoverGfx.fillStyle(0xffffff, 0.06);
      xHoverGfx.fillRoundedRect(cx - ghBtnW / 2, xBtnY - ghBtnH / 2, ghBtnW, ghBtnH, 4);
      xHoverGfx.setAlpha(1);
    });
    xHit.on('pointerout', () => {
      xText.setColor('#e0e0e0');
      xHoverGfx.setAlpha(0);
    });
    xHit.on('pointerdown', () => window.open(SOCIAL.X_URL, '_blank'));

    scene.tweens.add({
      targets: [xBg, xIconImg, xText],
      alpha: 1, duration: 400, delay: 950,
    });

    // ── Divider before dismiss ──
    const hr2 = this._el(scene.add.graphics().setDepth(D + 2).setScrollFactor(0).setAlpha(0));
    hr2.lineStyle(1, 0xffb300, 0.15);
    hr2.lineBetween(left + 30, top + ph - 65, left + pw - 30, top + ph - 65);
    scene.tweens.add({ targets: hr2, alpha: 1, duration: 300, delay: 1000 });

    // ── Dismiss button ──
    const dismissBtn = this._el(scene.add.text(cx, top + ph - 38, '[ CONTINUE MISSION — ESC ]', {
      fontSize: '15px', fontFamily: '"Black Ops One", cursive', color: '#33ff66',
    }).setOrigin(0.5).setDepth(D + 3).setScrollFactor(0).setAlpha(0)
      .setInteractive({ useHandCursor: true }));

    dismissBtn.on('pointerover', () => dismissBtn.setColor('#66ff99'));
    dismissBtn.on('pointerout', () => dismissBtn.setColor('#33ff66'));
    dismissBtn.on('pointerdown', () => this.close());

    scene.tweens.add({ targets: dismissBtn, alpha: 1, duration: 400, delay: 1100 });

    // ESC to dismiss
    this._escHandler = (e) => { if (e.key === 'Escape') this.close(); };
    scene.input.keyboard.on('keydown-ESC', this._escHandler);
  }
}
