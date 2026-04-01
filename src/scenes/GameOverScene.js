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

    // Dark overlay
    this.add.rectangle(960, 770, 1920, 1539, 0x000000, 0.75);

    // Card background
    this.add.rectangle(960, 700, 700, 480, 0x1a1a2e, 0.95)
      .setStrokeStyle(3, 0xef5350);

    // Title
    this.add.text(960, 520, '💥 GAME OVER 💥', {
      fontSize: '52px', fontFamily: 'Arial', color: '#ef5350', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Satirical headline
    const headline = HEADLINES[Phaser.Math.Between(0, HEADLINES.length - 1)](score);
    this.add.text(960, 600, `"${headline}"`, {
      fontSize: '18px', fontFamily: 'Arial', color: '#aaaaaa', fontStyle: 'italic',
      wordWrap: { width: 600 }, align: 'center',
    }).setOrigin(0.5);

    // Stats
    this.add.text(960, 690, `🚢 Tankers Through: ${score}`, {
      fontSize: '30px', fontFamily: 'Arial', color: '#FFD54F',
    }).setOrigin(0.5);

    this.add.text(960, 740, `⏱️ Survived: ${time}`, {
      fontSize: '24px', fontFamily: 'Arial', color: '#90CAF9',
    }).setOrigin(0.5);

    // Restart button
    const btn = this.add.text(960, 840, '🔄 TRY AGAIN', {
      fontSize: '28px', fontFamily: 'Arial', color: '#4CAF50',
      backgroundColor: '#2a2a2a', padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#66BB6A'));
    btn.on('pointerout', () => btn.setColor('#4CAF50'));
    btn.on('pointerdown', () => this.scene.start('Game'));
  }
}
