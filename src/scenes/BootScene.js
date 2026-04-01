import Phaser from 'phaser';

const BOOT_MESSAGES = [
  { text: 'CENTCOM TACTICAL INTERFACE v3.7.1', delay: 0 },
  { text: 'Establishing secure uplink... OK', delay: 300 },
  { text: 'Loading satellite imagery [STRAIT OF HORMUZ]...', delay: 700 },
  { text: 'Calibrating threat detection grid... OK', delay: 1200 },
  { text: 'IRGC naval assets detected in AO', delay: 1800, color: '#ef5350' },
  { text: 'Coalition fleet standing by', delay: 2200, color: '#4CAF50' },
  { text: 'Fuel reserves nominal', delay: 2500 },
  { text: 'COMMAND AUTHORITY GRANTED', delay: 2900, color: '#ffb300', bold: true },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const W = 1920;
    const H = 1539;
    const cx = W / 2;
    const cy = H / 2;

    // ── Full-screen dark background ──
    this.add.rectangle(cx, cy, W, H, 0x050a0f);

    // ── Scan lines ──
    const scanGfx = this.add.graphics();
    for (let y = 0; y < H; y += 3) {
      scanGfx.fillStyle(0x000000, 0.12);
      scanGfx.fillRect(0, y, W, 1);
    }

    // ── Title text ──
    const titleText = this.add.text(cx, cy - 180, 'STRAIT OF HORMUZ\nDEFENSE COMMAND', {
      fontSize: '42px',
      fontFamily: '"Black Ops One", cursive',
      color: '#33ff66',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      duration: 800,
      ease: 'Power2',
    });

    // Subtle glow behind title
    const titleGlow = this.add.text(cx, cy - 180, 'STRAIT OF HORMUZ\nDEFENSE COMMAND', {
      fontSize: '42px',
      fontFamily: '"Black Ops One", cursive',
      color: '#33ff66',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0, to: 0.15 },
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1000,
    });

    // ── Subtitle ──
    const subText = this.add.text(cx, cy - 100, 'INITIALIZING COMMAND CENTER...', {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffb300',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subText,
      alpha: { from: 0, to: 0.8 },
      duration: 600,
      delay: 400,
    });

    // Blink the subtitle
    this.tweens.add({
      targets: subText,
      alpha: { from: 0.8, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      delay: 1000,
    });

    // ── Progress bar (styled as military load bar) ──
    const barW = 500;
    const barH = 16;
    const barX = cx - barW / 2;
    const barY = cy - 30;

    // Bar outline
    const barOutline = this.add.graphics();
    barOutline.lineStyle(1, 0x33ff66, 0.4);
    barOutline.strokeRect(barX, barY, barW, barH);
    // Tick marks
    for (let i = 1; i < 10; i++) {
      barOutline.lineStyle(1, 0x33ff66, 0.15);
      barOutline.moveTo(barX + (barW / 10) * i, barY);
      barOutline.lineTo(barX + (barW / 10) * i, barY + barH);
    }
    barOutline.strokePath();

    // Progress fill
    const barFill = this.add.graphics();
    const pctText = this.add.text(cx + barW / 2 + 16, barY + barH / 2, '0%', {
      fontSize: '12px',
      fontFamily: '"Orbitron", sans-serif',
      color: '#33ff66',
    }).setOrigin(0, 0.5);

    this.load.on('progress', (val) => {
      barFill.clear();
      const fillW = (barW - 4) * val;
      barFill.fillStyle(0x33ff66, 0.7);
      barFill.fillRect(barX + 2, barY + 2, fillW, barH - 4);
      // Glow highlight on top
      barFill.fillStyle(0x66ff99, 0.3);
      barFill.fillRect(barX + 2, barY + 2, fillW, 3);
      pctText.setText(`${Math.floor(val * 100)}%`);
    });

    // ── Boot messages area ──
    this.bootTexts = [];
    const msgStartY = cy + 30;
    const msgX = cx - barW / 2;

    BOOT_MESSAGES.forEach((msg, i) => {
      const t = this.add.text(msgX, msgStartY + i * 22, '', {
        fontSize: '12px',
        fontFamily: '"Share Tech Mono", monospace',
        color: msg.color || '#8a9a7a',
        fontStyle: msg.bold ? 'bold' : 'normal',
      }).setAlpha(0);
      this.bootTexts.push({ textObj: t, message: msg.text, delay: msg.delay });
    });

    // ── Corner decorations ──
    const cornerGfx = this.add.graphics();
    cornerGfx.lineStyle(1, 0x33ff66, 0.3);
    const m = 40;
    const cLen = 30;
    // Top-left
    cornerGfx.moveTo(m, m + cLen); cornerGfx.lineTo(m, m); cornerGfx.lineTo(m + cLen, m);
    cornerGfx.strokePath(); cornerGfx.beginPath();
    // Top-right
    cornerGfx.moveTo(W - m - cLen, m); cornerGfx.lineTo(W - m, m); cornerGfx.lineTo(W - m, m + cLen);
    cornerGfx.strokePath(); cornerGfx.beginPath();
    // Bottom-left
    cornerGfx.moveTo(m, H - m - cLen); cornerGfx.lineTo(m, H - m); cornerGfx.lineTo(m + cLen, H - m);
    cornerGfx.strokePath(); cornerGfx.beginPath();
    // Bottom-right
    cornerGfx.moveTo(W - m - cLen, H - m); cornerGfx.lineTo(W - m, H - m); cornerGfx.lineTo(W - m, H - m - cLen);
    cornerGfx.strokePath();

    // ── Classification footer ──
    this.add.text(cx, H - 60, 'TOP SECRET // SCI // NOFORN', {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ef5350',
      letterSpacing: 3,
    }).setOrigin(0.5).setAlpha(0.4);

    // ── Coordinates ──
    this.add.text(cx, H - 40, '26.5667N  56.2500E  //  STRAIT OF HORMUZ  //  PERSIAN GULF AO', {
      fontSize: '9px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66',
    }).setOrigin(0.5).setAlpha(0.2);

    // ── Load the map asset ──
    this.load.image('map', 'assets/strait.jpg');
  }

  create() {
    // ── Typewriter boot messages ──
    let maxDelay = 0;
    this.bootTexts.forEach(({ textObj, message, delay }) => {
      const chars = message.split('');
      this.time.delayedCall(delay, () => {
        textObj.setAlpha(1);
        let charIndex = 0;
        const typeTimer = this.time.addEvent({
          delay: 25,
          repeat: chars.length - 1,
          callback: () => {
            charIndex++;
            textObj.setText('> ' + message.substring(0, charIndex) + (charIndex < chars.length ? '_' : ''));
          },
        });
      });
      const totalTime = delay + chars.length * 25 + 100;
      if (totalTime > maxDelay) maxDelay = totalTime;
    });

    // ── Transition to game after boot sequence completes ──
    const transitionDelay = Math.max(maxDelay + 600, 3600);

    this.time.delayedCall(transitionDelay, () => {
      // Flash effect before transition
      const flash = this.add.rectangle(960, 770, 1920, 1539, 0x33ff66, 0);
      this.tweens.add({
        targets: flash,
        fillAlpha: { from: 0, to: 0.3 },
        duration: 150,
        yoyo: true,
        onComplete: () => {
          // Fade to black then transition
          const fadeOut = this.add.rectangle(960, 770, 1920, 1539, 0x000000, 0).setDepth(500);
          this.tweens.add({
            targets: fadeOut,
            fillAlpha: 1,
            duration: 400,
            onComplete: () => {
              this.scene.start('Game');
            },
          });
        },
      });
    });
  }
}
