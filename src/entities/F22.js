import Phaser from 'phaser';
import { ADVANCED } from '../config/constants.js';
import { ensureTextures } from '../utils/textures.js';

export class F22 extends Phaser.GameObjects.Container {
  constructor(scene, x, y, airfield) {
    super(scene, x, y);
    this.scene = scene;
    this.airfield = airfield;
    this.state = 'GROUNDED'; // GROUNDED → FLYING_TO_TARGET → RETURNING → REFUELING
    this.target = null;
    this.targetPos = null;
    this.alive = true;
    this.speed = ADVANCED.F22_SPEED;
    this.bombDamage = ADVANCED.F22_BOMB_DAMAGE;
    this.refuelStart = 0;
    this._timers = [];

    ensureTextures(scene);

    // --- F-22 body (delta-wing silhouette) ---
    this.bodyGfx = scene.add.graphics();
    this._drawJet(this.bodyGfx);
    this.bodyGfx.setScale(1.5);
    this.add(this.bodyGfx);

    // --- Shadow (below jet on water surface) ---
    this.shadowGfx = scene.add.graphics();
    this.shadowGfx.fillStyle(0x000000, 0.15);
    this.shadowGfx.fillEllipse(0, 0, 30, 12);
    this.shadowGfx.setDepth(3);
    scene.add.existing(this.shadowGfx);

    // --- Afterburner trail ---
    if (scene.textures.exists('flare')) {
      this.trail = scene.add.particles(x, y, 'flare', {
        speed: { min: 10, max: 30 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 300,
        frequency: 25,
        quantity: 2,
        tint: [0xff8800, 0x4488ff],
        emitting: false,
      });
      this.trail.setDepth(7);
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10); // Above ships, below HUD
    this.setAlpha(0); // Hidden while grounded

    // Launch after brief grounded period
    const t = scene.time.delayedCall(1500, () => this._beginSortie());
    this._timers.push(t);
  }

  _drawJet(gfx) {
    gfx.clear();

    // Stealth body (dark grey angular shape)
    gfx.fillStyle(0x546e7a, 0.95);
    gfx.beginPath();
    gfx.moveTo(14, 0);        // nose
    gfx.lineTo(4, -3);        // upper fuselage
    gfx.lineTo(-6, -10);      // left wing tip
    gfx.lineTo(-8, -4);       // wing root
    gfx.lineTo(-12, -5);      // left tail
    gfx.lineTo(-10, -1);      // tail root
    gfx.lineTo(-10, 1);       // tail root
    gfx.lineTo(-12, 5);       // right tail
    gfx.lineTo(-8, 4);        // wing root
    gfx.lineTo(-6, 10);       // right wing tip
    gfx.lineTo(4, 3);         // lower fuselage
    gfx.closePath();
    gfx.fillPath();

    // Outline
    gfx.lineStyle(0.8, 0x90a4ae, 0.6);
    gfx.beginPath();
    gfx.moveTo(14, 0);
    gfx.lineTo(4, -3);
    gfx.lineTo(-6, -10);
    gfx.lineTo(-8, -4);
    gfx.lineTo(-12, -5);
    gfx.lineTo(-10, -1);
    gfx.lineTo(-10, 1);
    gfx.lineTo(-12, 5);
    gfx.lineTo(-8, 4);
    gfx.lineTo(-6, 10);
    gfx.lineTo(4, 3);
    gfx.closePath();
    gfx.strokePath();

    // Cockpit canopy (blue tint)
    gfx.fillStyle(0x42a5f5, 0.7);
    gfx.beginPath();
    gfx.moveTo(10, 0);
    gfx.lineTo(5, -1.5);
    gfx.lineTo(2, 0);
    gfx.lineTo(5, 1.5);
    gfx.closePath();
    gfx.fillPath();

    // Blue coalition stripe
    gfx.lineStyle(1, 0x2196f3, 0.5);
    gfx.lineBetween(-4, 0, 8, 0);

    // Engine glow (rear)
    gfx.fillStyle(0xff6600, 0.6);
    gfx.fillCircle(-10, 0, 2);
  }

  getRefuelProgress() {
    if (this.state !== 'REFUELING') return 1;
    const elapsed = this.scene.time.now - this.refuelStart;
    return Math.min(elapsed / ADVANCED.F22_REFUEL_MS, 1);
  }

  _beginSortie() {
    if (!this.scene || !this.scene.sys?.isActive()) return;
    if (!this.airfield || !this.airfield.active) return;

    this.target = this._pickRandomIRGCTarget();
    if (!this.target) {
      // No targets — wait and retry
      const t = this.scene.time.delayedCall(3000, () => this._beginSortie());
      this._timers.push(t);
      return;
    }
    this.targetPos = { x: this.target.x, y: this.target.y };
    this.state = 'FLYING_TO_TARGET';
    this.setAlpha(1);
    if (this.trail) this.trail.start();

    // Compute Bezier curve that overshoots 150px past target (jet flies THROUGH, never stops)
    this._flightStart = { x: this.x, y: this.y };
    this._flightT = 0;
    this._bombed = false;
    const dx = this.targetPos.x - this.x;
    const dy = this.targetPos.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this._flightEnd = {
      x: this.targetPos.x + (dx / d) * 150,
      y: this.targetPos.y + (dy / d) * 150,
    };
    this._flightCP = this._randomControlPoint(this._flightStart, this._flightEnd, 0.15);

    // Takeoff text
    const txt = this.scene.add.text(this.airfield.x, this.airfield.y - 30, '✈ SORTIE LAUNCHED', {
      fontSize: '12px', fontFamily: '"Share Tech Mono", monospace',
      color: '#64b5f6', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 25, alpha: 0, duration: 1000,
      onComplete: () => txt.destroy(),
    });
  }

  _pickRandomIRGCTarget() {
    const targets = [];
    for (const t of this.scene.irgcTowers?.getChildren() || []) {
      if (t.active) targets.push(t);
    }
    for (const r of this.scene.irgcRigs?.getChildren() || []) {
      if (r.active) targets.push(r);
    }
    if (targets.length === 0) return null;
    return targets[Math.floor(Math.random() * targets.length)];
  }

  update() {
    if (!this.alive || !this.active) return;

    switch (this.state) {
      case 'GROUNDED':
      case 'REFUELING':
        this._updateRefueling();
        break;
      case 'FLYING_TO_TARGET':
        this._updateFlying();
        break;
      case 'RETURNING':
        this._updateReturning();
        break;
    }

    // Update shadow position
    if (this.shadowGfx?.active) {
      this.shadowGfx.x = this.x + 5;
      this.shadowGfx.y = this.y + 8;
      this.shadowGfx.setAlpha(this.state === 'GROUNDED' || this.state === 'REFUELING' ? 0 : 0.15);
    }

    // Update trail
    if (this.trail?.active) {
      const rad = this.rotation;
      this.trail.setPosition(this.x - Math.cos(rad) * 12, this.y - Math.sin(rad) * 12);
    }
  }

  _randomControlPoint(from, to, strengthScale) {
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    // Perpendicular offset: strengthScale controls curve tightness (default 0.3-0.7)
    const base = strengthScale ?? 0.35;
    const strength = (base + Math.random() * base) * dist;
    const side = Math.random() < 0.5 ? 1 : -1;
    const px = -dy / dist;
    const py = dx / dist;
    return { x: mx + px * strength * side, y: my + py * strength * side };
  }

  _bezierPoint(t, p0, cp, p1) {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * cp.x + t * t * p1.x,
      y: u * u * p0.y + 2 * u * t * cp.y + t * t * p1.y,
    };
  }

  _updateFlying() {
    // Advance along Bezier curve (start → overshoot past target)
    const from = this._flightStart;
    const to = this._flightEnd;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const totalDist = Math.sqrt(dx * dx + dy * dy) || 1;
    const step = this.speed / (60 * totalDist);
    this._flightT = Math.min(this._flightT + step, 1);

    const pos = this._bezierPoint(this._flightT, from, this._flightCP, to);

    // Facing direction from tangent
    const nextT = Math.min(this._flightT + 0.02, 1);
    const nextPos = this._bezierPoint(nextT, from, this._flightCP, to);
    const tdx = nextPos.x - pos.x;
    const tdy = nextPos.y - pos.y;
    this.angle = Math.atan2(tdy, tdx) * (180 / Math.PI);

    if (this.body) this.body.setVelocity(0, 0);
    this.x = pos.x;
    this.y = pos.y;

    // Drop bomb when passing close to target (smooth flyby, no stopping)
    if (!this._bombed) {
      const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.targetPos.x, this.targetPos.y);
      if (distToTarget < 50) {
        this._bombed = true;
        this._dropBomb();
      }
    }

    // After overshoot, smoothly transition to return path
    if (this._flightT >= 1.0) {
      // Fallback: if curve didn't pass close enough, bomb now
      if (!this._bombed) {
        this._bombed = true;
        this._dropBomb();
      }
      if (!this.airfield || !this.airfield.active) {
        this.onAirfieldDestroyed();
        return;
      }
      this.state = 'RETURNING';
      this._returnStart = { x: this.x, y: this.y };
      this._returnT = 0;
      this._returnCP = this._randomControlPoint(this._returnStart, { x: this.airfield.x, y: this.airfield.y });
    }
  }

  _dropBomb() {
    if (!this.scene) return;
    const wx = this.targetPos.x;
    const wy = this.targetPos.y;

    // Deal damage to target if still alive
    if (this.target && this.target.active && this.target.takeDamage) {
      this.target.takeDamage(this.bombDamage);
    }

    // Bomb explosion visual
    if (this.scene.textures.exists('fire')) {
      const fire = this.scene.add.particles(wx, wy, 'fire', {
        speed: { min: 60, max: 160 }, scale: { start: 1.2, end: 0 },
        lifespan: { min: 300, max: 800 }, quantity: 14, emitting: false,
      });
      fire.setDepth(20); fire.explode(14);
      this.scene.time.delayedCall(1000, () => {
        if (!this.scene || !this.scene.sys?.isActive()) return;
        if (fire?.active) fire.destroy();
      });
    }

    // Flash ring
    const flash = this.scene.add.circle(wx, wy, 6, 0xffffff, 1).setDepth(21);
    this.scene.tweens.add({
      targets: flash, scaleX: 5, scaleY: 5, alpha: 0,
      duration: 400, ease: 'Cubic.easeOut', onComplete: () => flash.destroy(),
    });

    // Bomb damage text
    const txt = this.scene.add.text(wx, wy - 20, `💣 -${this.bombDamage}`, {
      fontSize: '16px', fontFamily: '"Black Ops One", cursive',
      color: '#ffab40', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({
      targets: txt, y: wy - 55, alpha: 0, duration: 1200,
      onComplete: () => txt.destroy(),
    });
  }

  _updateReturning() {
    if (!this.scene) return;
    if (!this.airfield || !this.airfield.active) {
      this.onAirfieldDestroyed();
      return;
    }

    const home = { x: this.airfield.x, y: this.airfield.y };
    const from = this._returnStart;
    const dx = home.x - from.x;
    const dy = home.y - from.y;
    const totalDist = Math.sqrt(dx * dx + dy * dy) || 1;
    const step = this.speed / (60 * totalDist);
    this._returnT = Math.min(this._returnT + step, 1);

    const pos = this._bezierPoint(this._returnT, from, this._returnCP, home);

    // Facing direction from tangent
    const nextT = Math.min(this._returnT + 0.02, 1);
    const nextPos = this._bezierPoint(nextT, from, this._returnCP, home);
    const tdx = nextPos.x - pos.x;
    const tdy = nextPos.y - pos.y;
    this.angle = Math.atan2(tdy, tdx) * (180 / Math.PI);

    if (this.body) this.body.setVelocity(0, 0);
    this.x = pos.x;
    this.y = pos.y;

    if (this._returnT >= 0.95) {
      // Landed — begin refueling
      this.x = this.airfield.x;
      this.y = this.airfield.y;
      this.state = 'REFUELING';
      this.refuelStart = this.scene.time.now;
      this.setAlpha(0);
      if (this.trail) this.trail.stop();
    }
  }

  _updateRefueling() {
    if (this.state !== 'REFUELING') return;
    const elapsed = this.scene.time.now - this.refuelStart;
    if (elapsed >= ADVANCED.F22_REFUEL_MS) {
      this._beginSortie();
    }
  }

  onAirfieldDestroyed() {
    this.alive = false;
    if (this.trail?.active) { this.trail.stop(); this.trail.destroy(); this.trail = null; }
    if (this.shadowGfx?.active) this.shadowGfx.destroy();
    this.shadowGfx = null;

    if (!this.scene) { this.destroy(); return; }

    // Crash explosion if in flight
    if (this.state === 'FLYING_TO_TARGET' || this.state === 'RETURNING') {
      if (this.scene.textures.exists('fire')) {
        const fire = this.scene.add.particles(this.x, this.y, 'fire', {
          speed: { min: 40, max: 100 }, scale: { start: 0.8, end: 0 },
          lifespan: 500, quantity: 8, emitting: false,
        });
        fire.setDepth(20); fire.explode(8);
        this.scene.time.delayedCall(700, () => {
          if (!this.scene || !this.scene.sys?.isActive()) return;
          if (fire?.active) fire.destroy();
        });
      }
    }
    this.destroy();
  }

  destroy(fromScene) {
    this._timers.forEach(t => { if (t) t.remove(false); });
    this._timers = [];
    if (this.trail?.active) { this.trail.stop(); this.trail.destroy(); }
    this.trail = null;
    if (this.shadowGfx?.active) this.shadowGfx.destroy();
    this.shadowGfx = null;
    if (this.bodyGfx?.active) this.bodyGfx.destroy();
    this.bodyGfx = null;
    super.destroy(fromScene);
  }
}
