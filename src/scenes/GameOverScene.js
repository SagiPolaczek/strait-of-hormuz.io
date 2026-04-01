import Phaser from 'phaser';

const HEADLINES = [
  (s) => `Admiral got ${s} tankers through before the IRGC said no`,
  (s) => `${s} tankers survived the gauntlet of doom`,
  (s) => `Breaking: ${s} oil tankers dodge missiles in Hormuz speedrun`,
  (s) => `Pentagon calls ${s}-tanker run "acceptable losses"`,
  (s) => `${s} tankers made it. The shareholders are pleased.`,
  (s) => `IRGC claims victory after only ${s} tankers slipped through`,
];

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create() {
    const { score = 0, time = '0:00' } = this.scene.settings.data || {};
    const W = 1920;
    const H = 1539;
    const cx = W / 2;

    // ── Dark overlay with fade-in ──
    const overlay = this.add.rectangle(cx, H / 2, W, H, 0x000000, 0)
      .setDepth(200);
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.82,
      duration: 600,
      ease: 'Power2',
    });

    // ── Scan lines over the whole screen ──
    const scanLines = this.add.graphics().setDepth(201).setAlpha(0);
    for (let y = 0; y < H; y += 3) {
      scanLines.fillStyle(0x000000, 0.1);
      scanLines.fillRect(0, y, W, 1);
    }
    this.tweens.add({
      targets: scanLines,
      alpha: 1,
      duration: 800,
      delay: 400,
    });

    // ── BREAKING NEWS ticker bar ──
    const tickerY = 380;
    const tickerBg = this.add.graphics().setDepth(210).setAlpha(0);
    tickerBg.fillStyle(0xd32f2f, 1);
    tickerBg.fillRect(0, tickerY, W, 44);
    tickerBg.fillStyle(0xffffff, 0.1);
    tickerBg.fillRect(0, tickerY, W, 1);
    tickerBg.fillRect(0, tickerY + 43, W, 1);

    const breakingLabel = this.add.text(40, tickerY + 22, 'BREAKING NEWS', {
      fontSize: '18px',
      fontFamily: '"Black Ops One", cursive',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(211).setAlpha(0);

    // Divider bar in the ticker
    const tickerDiv = this.add.rectangle(210, tickerY + 22, 2, 28, 0xffffff, 0.5)
      .setDepth(211).setAlpha(0);

    const headline = HEADLINES[Phaser.Math.Between(0, HEADLINES.length - 1)](score);
    const headlineText = this.add.text(230, tickerY + 22, headline.toUpperCase(), {
      fontSize: '14px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffffff',
      wordWrap: { width: W - 280 },
    }).setOrigin(0, 0.5).setDepth(211).setAlpha(0);

    // Animate ticker in
    this.tweens.add({
      targets: [tickerBg, breakingLabel, tickerDiv, headlineText],
      alpha: 1,
      duration: 400,
      delay: 800,
    });

    // ── Main debrief card ──
    const cardW = 680;
    const cardH = 520;
    const cardX = cx;
    const cardY = 680;

    // Card background
    const cardBg = this.add.graphics().setDepth(210).setAlpha(0);
    cardBg.fillStyle(0x0a0e14, 0.96);
    cardBg.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 6);
    cardBg.lineStyle(2, 0x33ff66, 0.4);
    cardBg.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 6);
    // Inner scan lines
    for (let y = cardY - cardH / 2; y < cardY + cardH / 2; y += 3) {
      cardBg.fillStyle(0x000000, 0.06);
      cardBg.fillRect(cardX - cardW / 2 + 2, y, cardW - 4, 1);
    }
    // Top accent line on card
    cardBg.fillStyle(0xef5350, 0.6);
    cardBg.fillRect(cardX - cardW / 2, cardY - cardH / 2, cardW, 2);

    this.tweens.add({
      targets: cardBg,
      alpha: 1,
      duration: 500,
      delay: 1000,
    });

    // ── MISSION TERMINATED header ──
    const missionTermText = this.add.text(cardX, cardY - cardH / 2 + 40, 'MISSION TERMINATED', {
      fontSize: '36px',
      fontFamily: '"Black Ops One", cursive',
      color: '#ef5350',
    }).setOrigin(0.5).setDepth(212).setAlpha(0);

    this.tweens.add({
      targets: missionTermText,
      alpha: 1, y: missionTermText.y,
      duration: 400,
      delay: 1200,
    });

    // Subtle pulse on the header
    this.tweens.add({
      targets: missionTermText,
      alpha: { from: 1, to: 0.7 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      delay: 1800,
    });

    // ── Horizontal rule ──
    const hrGfx = this.add.graphics().setDepth(212).setAlpha(0);
    hrGfx.lineStyle(1, 0x33ff66, 0.3);
    hrGfx.moveTo(cardX - cardW / 2 + 30, cardY - cardH / 2 + 70);
    hrGfx.lineTo(cardX + cardW / 2 - 30, cardY - cardH / 2 + 70);
    hrGfx.strokePath();
    this.tweens.add({ targets: hrGfx, alpha: 1, duration: 300, delay: 1300 });

    // ── DEBRIEF SECTION ──
    const debriefLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 85, 'OPERATION DEBRIEF', {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66',
      letterSpacing: 3,
    }).setDepth(212).setAlpha(0);
    this.tweens.add({ targets: debriefLabel, alpha: 0.6, duration: 300, delay: 1400 });

    // ── Tankers stat ──
    const tankerLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 120, 'TANKERS THROUGH STRAIT', {
      fontSize: '11px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#90CAF9',
    }).setDepth(212).setAlpha(0);

    const tankerValue = this.add.text(cardX + cardW / 2 - 40, cardY - cardH / 2 + 115, String(score).padStart(3, '0'), {
      fontSize: '40px',
      fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold',
      color: '#4CAF50',
    }).setOrigin(1, 0).setDepth(212).setAlpha(0);

    this.tweens.add({
      targets: [tankerLabel, tankerValue],
      alpha: 1,
      duration: 400,
      delay: 1600,
    });

    // ── Mission duration stat ──
    const durLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 180, 'MISSION DURATION', {
      fontSize: '11px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#90CAF9',
    }).setDepth(212).setAlpha(0);

    const durValue = this.add.text(cardX + cardW / 2 - 40, cardY - cardH / 2 + 175, time, {
      fontSize: '32px',
      fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold',
      color: '#ffb300',
    }).setOrigin(1, 0).setDepth(212).setAlpha(0);

    this.tweens.add({
      targets: [durLabel, durValue],
      alpha: 1,
      duration: 400,
      delay: 1800,
    });

    // ── Another horizontal rule ──
    const hr2 = this.add.graphics().setDepth(212).setAlpha(0);
    hr2.lineStyle(1, 0x33ff66, 0.2);
    hr2.moveTo(cardX - cardW / 2 + 30, cardY - cardH / 2 + 230);
    hr2.lineTo(cardX + cardW / 2 - 30, cardY - cardH / 2 + 230);
    hr2.strokePath();
    this.tweens.add({ targets: hr2, alpha: 1, duration: 300, delay: 1900 });

    // ── Performance rating ──
    const rating = score >= 20 ? 'EXCEPTIONAL' : score >= 10 ? 'ADEQUATE' : score >= 5 ? 'POOR' : 'DISASTROUS';
    const ratingColor = score >= 20 ? '#4CAF50' : score >= 10 ? '#FFD54F' : score >= 5 ? '#ff9800' : '#ef5350';

    const ratingLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 250, 'PERFORMANCE RATING', {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66',
      letterSpacing: 2,
    }).setDepth(212).setAlpha(0);

    const ratingValue = this.add.text(cardX, cardY - cardH / 2 + 285, rating, {
      fontSize: '28px',
      fontFamily: '"Black Ops One", cursive',
      color: ratingColor,
    }).setOrigin(0.5).setDepth(212).setAlpha(0);

    this.tweens.add({
      targets: [ratingLabel, ratingValue],
      alpha: 1,
      duration: 500,
      delay: 2100,
    });

    // ── CLASSIFIED stamp ──
    const stamp = this.add.text(cardX + 160, cardY - 40, 'CLASSIFIED', {
      fontSize: '48px',
      fontFamily: '"Black Ops One", cursive',
      color: '#ef5350',
    }).setOrigin(0.5).setDepth(213).setAlpha(0).setAngle(-18);

    // Stamp border
    const stampBorder = this.add.graphics().setDepth(212.5).setAlpha(0);
    stampBorder.lineStyle(3, 0xef5350, 0.7);
    // Draw rotated rectangle via polygon around the stamp position
    const stampW = 280;
    const stampH = 60;
    const stampCx = cardX + 160;
    const stampCy = cardY - 40;
    const rad = Phaser.Math.DegToRad(-18);
    const corners = [
      [-stampW / 2, -stampH / 2], [stampW / 2, -stampH / 2],
      [stampW / 2, stampH / 2], [-stampW / 2, stampH / 2],
    ].map(([lx, ly]) => ({
      x: stampCx + lx * Math.cos(rad) - ly * Math.sin(rad),
      y: stampCy + lx * Math.sin(rad) + ly * Math.cos(rad),
    }));
    stampBorder.beginPath();
    stampBorder.moveTo(corners[0].x, corners[0].y);
    corners.slice(1).forEach(c => stampBorder.lineTo(c.x, c.y));
    stampBorder.closePath();
    stampBorder.strokePath();

    // Dramatic stamp reveal
    this.tweens.add({
      targets: [stamp, stampBorder],
      alpha: 0.7,
      scaleX: { from: 2, to: 1 },
      scaleY: { from: 2, to: 1 },
      duration: 200,
      delay: 2600,
      ease: 'Back.easeOut',
    });

    // ── TRY AGAIN button ──
    const btnY = cardY + cardH / 2 - 55;
    const btnW = 260;
    const btnH = 44;

    const btnBg = this.add.graphics().setDepth(212).setAlpha(0);
    btnBg.fillStyle(0x1b5e20, 0.9);
    btnBg.fillRoundedRect(cardX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
    btnBg.lineStyle(2, 0x4CAF50, 0.8);
    btnBg.strokeRoundedRect(cardX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);

    const btnText = this.add.text(cardX, btnY, 'RETRY MISSION', {
      fontSize: '18px',
      fontFamily: '"Black Ops One", cursive',
      color: '#4CAF50',
    }).setOrigin(0.5).setDepth(213).setAlpha(0);

    const btnHit = this.add.rectangle(cardX, btnY, btnW, btnH, 0x000000, 0)
      .setDepth(214).setInteractive({ useHandCursor: true }).setAlpha(0);

    // Button animations
    this.tweens.add({
      targets: [btnBg, btnText, btnHit],
      alpha: 1,
      duration: 400,
      delay: 2900,
    });

    // Button pulse
    this.tweens.add({
      targets: btnText,
      alpha: { from: 1, to: 0.6 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      delay: 3300,
    });

    btnHit.on('pointerover', () => {
      btnText.setColor('#66BB6A');
      btnBg.clear();
      btnBg.fillStyle(0x2e7d32, 0.95);
      btnBg.fillRoundedRect(cardX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
      btnBg.lineStyle(2, 0x66BB6A, 1);
      btnBg.strokeRoundedRect(cardX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
    });
    btnHit.on('pointerout', () => {
      btnText.setColor('#4CAF50');
      btnBg.clear();
      btnBg.fillStyle(0x1b5e20, 0.9);
      btnBg.fillRoundedRect(cardX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
      btnBg.lineStyle(2, 0x4CAF50, 0.8);
      btnBg.strokeRoundedRect(cardX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
    });
    btnHit.on('pointerdown', () => this.scene.start('Game'));

    // ── SHARE area (visual concept) ──
    const shareY = cardY + cardH / 2 - 15;
    const shareText = this.add.text(cardX, shareY, 'DECLASSIFY  //  SHARE INTEL', {
      fontSize: '10px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#666666',
    }).setOrigin(0.5).setDepth(212).setAlpha(0);

    this.tweens.add({
      targets: shareText,
      alpha: 0.5,
      duration: 400,
      delay: 3200,
    });

    // ── Footer coordinates ──
    const footerText = this.add.text(cardX, cardY + cardH / 2 + 20, 'STRAIT OF HORMUZ  //  26.5667N  56.2500E  //  CENTCOM EYES ONLY', {
      fontSize: '9px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66',
    }).setOrigin(0.5).setDepth(210).setAlpha(0);

    this.tweens.add({
      targets: footerText,
      alpha: 0.3,
      duration: 400,
      delay: 3400,
    });
  }
}
