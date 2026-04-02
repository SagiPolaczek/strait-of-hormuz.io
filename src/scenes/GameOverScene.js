import Phaser from 'phaser';
import { LeaderboardManager } from '../systems/LeaderboardManager.js';
import { DebriefRenderer } from '../ui/DebriefRenderer.js';

const DEFEAT_HEADLINES = [
  (s) => `Admiral got ${s} tankers through before the IRGC said no`,
  (s) => `${s} tankers survived the gauntlet of doom`,
  (s) => `Breaking: ${s} oil tankers dodge missiles in Hormuz speedrun`,
  (s) => `Pentagon calls ${s}-tanker run "acceptable losses"`,
  (s) => `IRGC claims victory after only ${s} tankers slipped through`,
];

const VICTORY_HEADLINES = [
  (s) => `Coalition secures strait — ${s} tankers break the blockade`,
  (s) => `${s} tankers prove the strait belongs to the free world`,
  (s) => `Oil flows again: ${s} tankers shatter IRGC's grip on Hormuz`,
  (s) => `Mission accomplished — ${s} tankers and counting`,
  (s) => `IRGC retreats after ${s} tankers punch through the strait`,
];

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create() {
    const { score = 0, time = '0:00', outcome = 'defeat', balance = 0 } = this.scene.settings.data || {};
    const isVictory = outcome === 'victory';
    const W = 1920;
    const H = 1539;
    const cx = W / 2;

    // Color palette
    const accent = isVictory ? '#4CAF50' : '#ef5350';
    const accentHex = isVictory ? 0x4CAF50 : 0xef5350;
    const accentDark = isVictory ? 0x1b5e20 : 0x7f0000;

    // ── Dark overlay ──
    const overlay = this.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setDepth(200);
    this.tweens.add({ targets: overlay, fillAlpha: 0.82, duration: 600, ease: 'Power2' });

    // ── Faded satellite map background with slow pan ──
    const mapBg = this.add.image(cx, H / 2, 'map').setDisplaySize(2100, 1680).setDepth(199).setAlpha(0);
    this.tweens.add({ targets: mapBg, alpha: 0.08, duration: 2000 });
    this.tweens.add({
      targets: mapBg, x: cx - 40, y: H / 2 - 20,
      duration: 30000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    // Scan lines
    const scanLines = this.add.graphics().setDepth(201).setAlpha(0);
    for (let y = 0; y < H; y += 3) {
      scanLines.fillStyle(0x000000, 0.1);
      scanLines.fillRect(0, y, W, 1);
    }
    this.tweens.add({ targets: scanLines, alpha: 1, duration: 800, delay: 400 });

    // ── Main debrief card ──
    const cardW = 700;
    const cardH = 640;
    const cardX = cx;
    const cardY = 700;

    const cardBg = this.add.graphics().setDepth(210).setAlpha(0);
    cardBg.fillStyle(0x0a0e14, 0.96);
    cardBg.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 6);
    cardBg.lineStyle(2, isVictory ? 0x4CAF50 : 0x33ff66, 0.4);
    cardBg.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 6);
    for (let y = cardY - cardH / 2; y < cardY + cardH / 2; y += 3) {
      cardBg.fillStyle(0x000000, 0.06);
      cardBg.fillRect(cardX - cardW / 2 + 2, y, cardW - 4, 1);
    }
    cardBg.fillStyle(accentHex, 0.6);
    cardBg.fillRect(cardX - cardW / 2, cardY - cardH / 2, cardW, 2);

    this.tweens.add({ targets: cardBg, alpha: 1, duration: 500, delay: 1000 });

    // Pulsing accent border
    const cardGlow = this.add.graphics().setDepth(210.5).setAlpha(0);
    cardGlow.lineStyle(2, accentHex, 0.6);
    cardGlow.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 6);
    this.tweens.add({ targets: cardGlow, alpha: 1, duration: 600, delay: 1200 });
    this.tweens.add({
      targets: cardGlow, alpha: { from: 0.8, to: 0.3 },
      duration: 1500, yoyo: true, repeat: -1, delay: 1800,
    });

    // ── Title ──
    const title = isVictory ? 'MISSION COMPLETE' : 'MISSION TERMINATED';
    const titleText = this.add.text(cardX, cardY - cardH / 2 + 40, title, {
      fontSize: '36px', fontFamily: '"Black Ops One", cursive', color: accent,
    }).setOrigin(0.5).setDepth(212).setAlpha(0);

    this.tweens.add({ targets: titleText, alpha: 1, duration: 400, delay: 1200 });
    this.tweens.add({
      targets: titleText, alpha: { from: 1, to: 0.7 },
      duration: 1200, yoyo: true, repeat: -1, delay: 1800,
    });

    // ── HR ──
    const hr = this.add.graphics().setDepth(212).setAlpha(0);
    hr.lineStyle(1, isVictory ? 0x4CAF50 : 0x33ff66, 0.3);
    hr.lineBetween(cardX - cardW / 2 + 30, cardY - cardH / 2 + 70, cardX + cardW / 2 - 30, cardY - cardH / 2 + 70);
    this.tweens.add({ targets: hr, alpha: 1, duration: 300, delay: 1300 });

    // ── Debrief section label ──
    const debriefLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 85, 'OPERATION DEBRIEF', {
      fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66', letterSpacing: 3,
    }).setDepth(212).setAlpha(0);
    this.tweens.add({ targets: debriefLabel, alpha: 0.6, duration: 300, delay: 1400 });

    // ── Tankers stat ──
    const tankerLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 115, 'TANKERS THROUGH STRAIT', {
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#90CAF9',
    }).setDepth(212).setAlpha(0);
    const tankerValue = this.add.text(cardX + cardW / 2 - 40, cardY - cardH / 2 + 110, String(score).padStart(3, '0'), {
      fontSize: '40px', fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold', color: '#4CAF50',
    }).setOrigin(1, 0).setDepth(212).setAlpha(0);

    this.tweens.add({
      targets: [tankerValue, tankerLabel],
      alpha: 1, duration: 400, delay: 1600,
    });

    // ── Staggered reveal: explicit per-element tweens ──
    const fadeIn = (targets, delay, alpha = 1) => {
      const arr = Array.isArray(targets) ? targets : [targets];
      arr.forEach(t => {
        this.tweens.add({ targets: t, alpha, duration: 400, delay });
      });
    };

    // ── Duration stat ──
    const durLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 170, 'MISSION DURATION', {
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#90CAF9',
    }).setDepth(212).setAlpha(0);
    const durValue = this.add.text(cardX + cardW / 2 - 40, cardY - cardH / 2 + 165, time, {
      fontSize: '32px', fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold', color: '#ffb300',
    }).setOrigin(1, 0).setDepth(212).setAlpha(0);
    fadeIn([durLabel, durValue], 1700);

    // ── Balance meter final ──
    const balLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 225, 'STRAIT CONTROL', {
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#90CAF9',
    }).setDepth(212).setAlpha(0);
    const balColor = balance > 0 ? '#42a5f5' : balance < 0 ? '#ef5350' : '#ffffff';
    const balValue = this.add.text(cardX + cardW / 2 - 40, cardY - cardH / 2 + 220, `${balance > 0 ? '+' : ''}${balance}`, {
      fontSize: '28px', fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold', color: balColor,
    }).setOrigin(1, 0).setDepth(212).setAlpha(0);
    fadeIn([balLabel, balValue], 1800);

    // ── Outcome reason ──
    let reasonText = '';
    if (isVictory) {
      reasonText = 'COALITION SECURED FULL CONTROL OF THE STRAIT';
    } else if (balance <= -100) {
      reasonText = 'IRGC ACHIEVED TOTAL DOMINANCE — STRAIT BLOCKADED';
    } else {
      reasonText = 'COALITION RESOURCES EXHAUSTED — UNABLE TO CONTINUE';
    }
    const reasonTextObj = this.add.text(cardX, cardY - cardH / 2 + 260, reasonText, {
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace',
      color: '#90CAF9', letterSpacing: 1,
    }).setOrigin(0.5).setDepth(212).setAlpha(0);
    fadeIn(reasonTextObj, 1900);

    // ── HR 2 ──
    const hr2 = this.add.graphics().setDepth(212).setAlpha(0);
    hr2.lineStyle(1, 0x33ff66, 0.2);
    hr2.lineBetween(cardX - cardW / 2 + 30, cardY - cardH / 2 + 270, cardX + cardW / 2 - 30, cardY - cardH / 2 + 270);
    fadeIn(hr2, 1500);

    // ── Performance rating ──
    const rating = score >= 20 ? 'EXCEPTIONAL' : score >= 10 ? 'ADEQUATE' : score >= 5 ? 'POOR' : 'DISASTROUS';
    const ratingColor = score >= 20 ? '#4CAF50' : score >= 10 ? '#FFD54F' : score >= 5 ? '#ff9800' : '#ef5350';

    const ratingLabel = this.add.text(cardX - cardW / 2 + 40, cardY - cardH / 2 + 285, 'PERFORMANCE RATING', {
      fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66', letterSpacing: 2,
    }).setDepth(212).setAlpha(0);

    const ratingValue = this.add.text(cardX, cardY - cardH / 2 + 315, isVictory ? 'VICTORY' : rating, {
      fontSize: '28px', fontFamily: '"Black Ops One", cursive',
      color: isVictory ? '#4CAF50' : ratingColor,
    }).setOrigin(0.5).setDepth(212).setAlpha(0);
    fadeIn([ratingLabel, ratingValue], 2000);

    // Rating threshold hint
    const ratingExplain = isVictory ? '' :
      score >= 20 ? '' :
      score >= 10 ? '20+ tankers for EXCEPTIONAL' :
      score >= 5 ? '10+ tankers for ADEQUATE' :
      '5+ tankers for POOR';
    if (ratingExplain) {
      const ratingHint = this.add.text(cardX, cardY - cardH / 2 + 345, ratingExplain, {
        fontSize: '10px', fontFamily: '"Share Tech Mono", monospace', color: '#555555',
      }).setOrigin(0.5).setDepth(212).setAlpha(0);
      fadeIn(ratingHint, 2000);
    }

    // ── Stamp ──
    const stampText = isVictory ? 'MISSION SUCCESS' : 'CLASSIFIED';
    const stampColor = isVictory ? '#4CAF50' : '#ef5350';
    const stamp = this.add.text(cardX + 160, cardY - 20, stampText, {
      fontSize: '42px', fontFamily: '"Black Ops One", cursive', color: stampColor,
    }).setOrigin(0.5).setDepth(213).setAlpha(0).setAngle(-18);

    const stampW = 300;
    const stampH = 55;
    const stampCx = cardX + 160;
    const stampCy = cardY - 20;
    const rad = Phaser.Math.DegToRad(-18);
    const stampBorder = this.add.graphics().setDepth(212.5).setAlpha(0);
    stampBorder.lineStyle(3, isVictory ? 0x4CAF50 : 0xef5350, 0.7);
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

    this.tweens.add({
      targets: [stamp, stampBorder], alpha: 0.7,
      scaleX: { from: 2, to: 1 }, scaleY: { from: 2, to: 1 },
      duration: 200, delay: 2400, ease: 'Back.easeOut',
    });

    // ── LEADERBOARD ──
    const lbY = cardY - cardH / 2 + 365;
    const lbHeader = this.add.text(cardX - cardW / 2 + 40, lbY, 'LEADERBOARD', {
      fontSize: '10px', fontFamily: '"Share Tech Mono", monospace',
      color: '#33ff66', letterSpacing: 3,
    }).setDepth(212).setAlpha(0);

    const hr3 = this.add.graphics().setDepth(212).setAlpha(0);
    hr3.lineStyle(1, 0x33ff66, 0.15);
    hr3.lineBetween(cardX - cardW / 2 + 30, lbY + 18, cardX + cardW / 2 - 30, lbY + 18);

    // Header row
    const lbColHeader = this.add.text(cardX - cardW / 2 + 45, lbY + 24, '#  SCORE  TIME     RESULT     DATE', {
      fontSize: '9px', fontFamily: '"Share Tech Mono", monospace', color: '#666666',
    }).setDepth(212).setAlpha(0);

    fadeIn([lbHeader, hr3, lbColHeader], 2200);

    const board = LeaderboardManager.load();
    const maxShow = Math.min(board.length, 7);
    for (let i = 0; i < maxShow; i++) {
      const entry = board[i];
      const isCurrent = entry.score === score && entry.time === time && entry.outcome === outcome;
      const color = isCurrent ? '#FFD54F' : '#b0bec5';
      const prefix = isCurrent ? '>' : ' ';
      const outcomeLabel = entry.outcome === 'victory' ? 'WIN ' : 'LOSS';
      const line = `${prefix}${String(i + 1).padStart(2)}  ${String(entry.score).padStart(3, '0')}   ${(entry.time || '?:??').padEnd(7)}  ${outcomeLabel}    ${entry.date || ''}`;
      const rowText = this.add.text(cardX - cardW / 2 + 40, lbY + 40 + i * 18, line, {
        fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color,
        fontStyle: isCurrent ? 'bold' : 'normal',
      }).setDepth(212).setAlpha(0);
      fadeIn(rowText, 2200);
    }

    if (board.length === 0) {
      const emptyRow = this.add.text(cardX, lbY + 60, 'No entries yet', {
        fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#666666',
      }).setOrigin(0.5).setDepth(212).setAlpha(0);
      fadeIn(emptyRow, 2200);
    }

    // ── Buttons row ──
    const btnY = cardY + cardH / 2 - 55;

    // RETRY button
    const retryBtnW = 220;
    const retryBtnH = 44;
    const retryBtnX = cardX - 130;

    const retryBg = this.add.graphics().setDepth(212).setAlpha(0);
    retryBg.fillStyle(0x1b5e20, 0.9);
    retryBg.fillRoundedRect(retryBtnX - retryBtnW / 2, btnY - retryBtnH / 2, retryBtnW, retryBtnH, 4);
    retryBg.lineStyle(2, 0x4CAF50, 0.8);
    retryBg.strokeRoundedRect(retryBtnX - retryBtnW / 2, btnY - retryBtnH / 2, retryBtnW, retryBtnH, 4);

    const retryText = this.add.text(retryBtnX, btnY, 'RETRY MISSION', {
      fontSize: '16px', fontFamily: '"Black Ops One", cursive', color: '#4CAF50',
    }).setOrigin(0.5).setDepth(213).setAlpha(0);

    const retryHit = this.add.rectangle(retryBtnX, btnY, retryBtnW, retryBtnH, 0x000000, 0)
      .setDepth(214).setInteractive({ useHandCursor: true }).setAlpha(0);

    retryHit.on('pointerover', () => retryText.setColor('#66BB6A'));
    retryHit.on('pointerout', () => retryText.setColor('#4CAF50'));
    retryHit.on('pointerdown', () => this.scene.start('Game'));

    // SAVE DEBRIEF button (replaces old share)
    const saveBtnW = 220;
    const saveBtnH = 44;
    const saveBtnX = cardX + 130;

    const saveBg = this.add.graphics().setDepth(212).setAlpha(0);
    saveBg.fillStyle(0x0d47a1, 0.9);
    saveBg.fillRoundedRect(saveBtnX - saveBtnW / 2, btnY - saveBtnH / 2, saveBtnW, saveBtnH, 4);
    saveBg.lineStyle(2, 0x42a5f5, 0.8);
    saveBg.strokeRoundedRect(saveBtnX - saveBtnW / 2, btnY - saveBtnH / 2, saveBtnW, saveBtnH, 4);

    const saveText = this.add.text(saveBtnX, btnY, 'SAVE DEBRIEF', {
      fontSize: '16px', fontFamily: '"Black Ops One", cursive', color: '#42a5f5',
    }).setOrigin(0.5).setDepth(213).setAlpha(0);

    const saveHit = this.add.rectangle(saveBtnX, btnY, saveBtnW, saveBtnH, 0x000000, 0)
      .setDepth(214).setInteractive({ useHandCursor: true }).setAlpha(0);

    saveHit.on('pointerover', () => saveText.setColor('#64b5f6'));
    saveHit.on('pointerout', () => saveText.setColor('#42a5f5'));
    saveHit.on('pointerdown', async () => {
      saveText.setText('RENDERING...');
      try {
        const callsign = localStorage.getItem('hormuz_callsign') || 'UNKNOWN';
        const ratingVal = score >= 20 ? 'EXCEPTIONAL' : score >= 10 ? 'ADEQUATE' : score >= 5 ? 'POOR' : 'DISASTROUS';
        const ratingCol = score >= 20 ? '#4CAF50' : score >= 10 ? '#FFD54F' : score >= 5 ? '#ff9800' : '#ef5350';
        const mapImg = this.textures.get('map').getSourceImage();
        const result = await DebriefRenderer.share({
          score, time, outcome, balance, callsign,
          rating: ratingVal, ratingColor: ratingCol,
        }, mapImg);
        saveText.setText(result === 'shared' ? 'SHARED!' : result === 'cancelled' ? 'SAVE DEBRIEF' : 'SAVED!');
      } catch (e) {
        saveText.setText('FAILED');
      }
      this.time.delayedCall(2000, () => saveText.setText('SAVE DEBRIEF'));
    });

    // Animate buttons in (NOT hit-areas — they stay invisible)
    this.tweens.add({
      targets: [retryBg, retryText, saveBg, saveText],
      alpha: 1, duration: 400, delay: 2700,
    });
    // Hit areas: make interactive immediately but keep invisible
    this.time.delayedCall(2700, () => {
      retryHit.setAlpha(0.001);
      saveHit.setAlpha(0.001);
    });

    // Pulse retry
    this.tweens.add({
      targets: retryText, alpha: { from: 1, to: 0.6 },
      duration: 1000, yoyo: true, repeat: -1, delay: 3100,
    });

    // ── Footer ──
    const footerText = this.add.text(cx, cardY + cardH / 2 + 20, 'STRAIT OF HORMUZ  //  26.5667N  56.2500E  //  CENTCOM EYES ONLY', {
      fontSize: '9px', fontFamily: '"Share Tech Mono", monospace', color: '#33ff66',
    }).setOrigin(0.5).setDepth(210).setAlpha(0);
    fadeIn(footerText, 2800, 0.3);
  }
}
