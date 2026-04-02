import Phaser from 'phaser';

const POSITIVE_QUOTES = [
  "We're gonna DRILL, BABY, DRILL! Oil like you've NEVER SEEN!",
  "I just made a TREMENDOUS deal with the Saudis. HUGE. Oil is going WAY UP!",
  "NOBODY — and I mean NOBODY — knows more about oil than ME. Believe me.",
  "The Strait is OPEN FOR BUSINESS! We're winning SO BIGLY right now!",
  "I put the BIGGEST TARIFFS in HISTORY on Iranian oil. MASSIVE. BEAUTIFUL.",
  "I called MBS — GREAT guy by the way — and said 'We need oil UP.' DONE.",
  "We have the GREATEST MILITARY the world has EVER SEEN. Oil is BOOMING!",
  "They said it COULDN'T be done. I DID IT. Oil prices — THROUGH THE ROOF!",
  "OPEC called me — they actually called ME — and said 'Sir, you were RIGHT.'",
  "The oil market was a TOTAL DISASTER before me. Now? PERFECT. You're WELCOME.",
  "Iran is VERY scared right now. VERY, VERY scared. Oil goes UP, UP, UP!",
  "I'm putting AMERICA FIRST. And that means EXPENSIVE, BEAUTIFUL OIL!",
];

const NEGATIVE_QUOTES = [
  "Oil prices are TOO HIGH. I'm calling the Saudis RIGHT NOW. Coming DOWN!",
  "I'm releasing the STRATEGIC RESERVES. BIGLY. Prices will be BEAUTIFUL.",
  "We have MORE OIL than we know what to do with! TOO MUCH! Prices DOWN!",
  "Just made a DEAL with Iran. A BEAUTIFUL deal. Very CHEAP oil coming!",
  "The oil market is TOTALLY RIGGED. I'm FIXING it. MUCH CHEAPER. Watch!",
  "I told OPEC — and they LISTEN to me, by the way — 'LOWER THE PRICE.' DONE.",
  "Gas prices? I'm bringing them down to TWO DOLLARS. Maybe LESS. WATCH!",
  "The FAKE NEWS won't tell you this, but oil is going WAY DOWN. SAD!",
  "I'm the BEST negotiator. THE BEST. Oil prices? CRUSHED. You're WELCOME.",
  "Other presidents let oil go CRAZY. Not me. I said 'BRING IT DOWN.' DONE.",
  "We're gonna FLOOD THE MARKET. So much oil. THE MOST OIL EVER. CHEAP!",
  "Iran thinks they can raise prices? WRONG. I don't THINK so. Going DOWN.",
];

export class TrumpShock {
  constructor(scene, economy) {
    this.scene = scene;
    this.economy = economy;
    this.multiplier = 1.0;
    this.active = false;
    this.minInterval = 30000;   // min 30s between events
    this.meanInterval = 120000; // mean 2 minutes (exponential dist)
    this._nextTimer = null;
    this._currentSound = null;

    // Trump voice clips (loaded in BootScene)
    this.TRUMP_CLIPS = [
      'trump_fake_news', 'trump_dont_be_rude', 'trump_dont_give_a_damn',
      'trump_died_like_a_dog', 'trump_approves_this', 'trump_best_words',
      'trump_win_too_much', 'trump_im_going_2_come',
    ];

    // HUD multiplier badge
    this.badge = scene.add.text(480, 10, '', {
      fontSize: '14px',
      fontFamily: '"Orbitron", sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setDepth(103).setScrollFactor(0).setAlpha(0);

    // Schedule first event
    this._scheduleNext();

    // Easter egg: type "TRUMP" to trigger Trump immediately
    this._cheatBuffer = '';
    scene.input.keyboard.on('keydown', (event) => {
      if (event.key.length !== 1) return;
      this._cheatBuffer += event.key.toUpperCase();
      if (this._cheatBuffer.length > 10) this._cheatBuffer = this._cheatBuffer.slice(-10);
      if (this._cheatBuffer.endsWith('TRUMP')) {
        this._cheatBuffer = '';
        if (!this.active) this._trigger();
      }
    });
  }

  _scheduleNext() {
    if (this._nextTimer) this._nextTimer.remove(false);
    const delay = Math.max(this.minInterval, -this.meanInterval * Math.log(Math.random()));
    this._nextTimer = this.scene.time.delayedCall(delay, () => this._trigger());
  }

  _trigger() {
    if (this.active) { this._scheduleNext(); return; }
    this.active = true;

    // Random K% change between 1-10, random sign (range: -10% to +10%)
    const k = Phaser.Math.Between(1, 10);
    const positive = Math.random() < 0.5;
    const change = positive ? (1 + k / 100) : (1 - k / 100);

    // Apply and clamp multiplier
    this.multiplier = Phaser.Math.Clamp(this.multiplier * change, 0.5, 2.0);

    // Pick quote
    const quotes = positive ? POSITIVE_QUOTES : NEGATIVE_QUOTES;
    const quote = quotes[Phaser.Math.Between(0, quotes.length - 1)];

    this._showEvent(quote, k, positive);

    // Schedule next
    this.scene.time.delayedCall(4500, () => {
      this.active = false;
      this._scheduleNext();
    });
  }

  _showEvent(quote, k, positive) {
    const W = 1920;
    const H = 1539;

    // ── Play random Trump voice clip ──
    this._playRandomClip();

    // ── Trump image slides in from bottom-right ──
    const trump = this.scene.add.image(W - 100, H + 200, 'trump')
      .setOrigin(0.5, 1)
      .setDepth(180)
      .setScale(1.3);

    this.scene.tweens.add({
      targets: trump,
      y: H - 100,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // ── Speech bubble ──
    const bubbleX = W - 500;
    const bubbleY = 420;
    const bubbleW = 720;
    const bubbleH = 240;

    const bubble = this.scene.add.graphics().setDepth(181);
    bubble.fillStyle(0xffffff, 0.97);
    bubble.fillRoundedRect(bubbleX - bubbleW / 2, bubbleY - bubbleH / 2, bubbleW, bubbleH, 14);
    // Speech tail pointing toward trump
    bubble.fillTriangle(
      bubbleX + 140, bubbleY + bubbleH / 2,
      bubbleX + 180, bubbleY + bubbleH / 2 + 35,
      bubbleX + 200, bubbleY + bubbleH / 2
    );
    bubble.lineStyle(4, 0xcc0000, 0.9);
    bubble.strokeRoundedRect(bubbleX - bubbleW / 2, bubbleY - bubbleH / 2, bubbleW, bubbleH, 14);
    bubble.setAlpha(0);

    const quoteText = this.scene.add.text(bubbleX, bubbleY, `"${quote}"`, {
      fontSize: '28px',
      fontFamily: '"Black Ops One", cursive',
      color: '#1a1a1a',
      wordWrap: { width: bubbleW - 60 },
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setDepth(182).setAlpha(0);

    // Fade in bubble
    this.scene.tweens.add({
      targets: [bubble, quoteText],
      alpha: 1,
      duration: 300,
      delay: 400,
    });

    // ── Oil price change flash ──
    const sign = positive ? '+' : '-';
    const color = positive ? '#4CAF50' : '#ef5350';
    const changeText = this.scene.add.text(W / 2, H / 2 - 100, `OIL ${sign}${k}%`, {
      fontSize: '96px',
      fontFamily: '"Black Ops One", cursive',
      color,
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(185).setAlpha(0);

    this.scene.tweens.add({
      targets: changeText,
      alpha: 1,
      scaleX: { from: 0.5, to: 1.2 },
      scaleY: { from: 0.5, to: 1.2 },
      duration: 400,
      delay: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: changeText,
          scaleX: 1, scaleY: 1,
          duration: 200,
        });
      },
    });

    // Multiplier sub-text
    const multText = this.scene.add.text(W / 2, H / 2 - 20, `Oil Value: ${this.multiplier.toFixed(2)}x`, {
      fontSize: '32px',
      fontFamily: '"Share Tech Mono", monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(185).setAlpha(0);

    this.scene.tweens.add({
      targets: multText,
      alpha: 0.8,
      duration: 300,
      delay: 900,
    });

    // ── Update HUD badge ──
    this._updateBadge();

    // ── Clean up everything after 4 seconds ──
    this.scene.time.delayedCall(3500, () => {
      // Slide trump out
      this.scene.tweens.add({
        targets: trump,
        y: H + 200,
        duration: 400,
        ease: 'Cubic.easeIn',
        onComplete: () => trump.destroy(),
      });

      // Fade out bubble + text
      this.scene.tweens.add({
        targets: [bubble, quoteText, changeText, multText],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          bubble.destroy();
          quoteText.destroy();
          changeText.destroy();
          multText.destroy();
        },
      });
    });
  }

  _updateBadge() {
    if (Math.abs(this.multiplier - 1.0) < 0.005) {
      this.badge.setAlpha(0);
      return;
    }
    const color = this.multiplier > 1 ? '#4CAF50' : '#ef5350';
    this.badge.setText(`OIL ${this.multiplier.toFixed(2)}x`).setColor(color).setAlpha(0.8);
  }

  // Called by EconomyManager to scale oil income
  _playRandomClip() {
    // Stop any currently playing trump clip
    if (this._currentSound?.isPlaying) this._currentSound.stop();

    const clipKey = this.TRUMP_CLIPS[Math.floor(Math.random() * this.TRUMP_CLIPS.length)];
    if (this.scene.cache.audio.exists(clipKey)) {
      this._currentSound = this.scene.sound.add(clipKey, { volume: 0.6 });
      this._currentSound.play();
    }
  }

  getMultiplier() {
    return this.multiplier;
  }
}
