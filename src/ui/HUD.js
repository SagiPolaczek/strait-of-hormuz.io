export class HUD {
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.startTime = Date.now();

    const style = { fontSize: '20px', fontFamily: 'Arial, sans-serif', color: '#ffffff' };

    // Top bar background
    this.bg = scene.add.rectangle(960, 22, 1920, 44, 0x000000, 0.7)
      .setDepth(100).setScrollFactor(0);

    this.oilText = scene.add.text(200, 12, '', { ...style, color: '#FFD54F' })
      .setDepth(101).setScrollFactor(0);
    this.scoreText = scene.add.text(600, 12, '', { ...style, color: '#4CAF50' })
      .setDepth(101).setScrollFactor(0);
    this.timerText = scene.add.text(960, 12, '', { ...style, color: '#90CAF9' })
      .setDepth(101).setScrollFactor(0);
    this.threatText = scene.add.text(1300, 12, '', { ...style, color: '#ef5350' })
      .setDepth(101).setScrollFactor(0);
  }

  update(score) {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = String(elapsed % 60).padStart(2, '0');
    const oil = Math.floor(this.economy.coalitionOil);
    const rigs = this.economy.coalitionRigs.length;

    this.oilText.setText(`🛢️ OIL: ${oil}  (${rigs} rigs)`);
    this.scoreText.setText(`🚢 THROUGH: ${score}`);
    this.timerText.setText(`⏱️ ${minutes}:${seconds}`);

    const threat = elapsed < 120 ? 'LOW' : elapsed < 300 ? 'MEDIUM' : elapsed < 600 ? 'HIGH' : 'EXTREME';
    const threatColor = { LOW: '#4CAF50', MEDIUM: '#FFD54F', HIGH: '#ef5350', EXTREME: '#d32f2f' }[threat];
    this.threatText.setText(`⚠️ ${threat}`).setColor(threatColor);
  }

  getTimeString() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = String(elapsed % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
