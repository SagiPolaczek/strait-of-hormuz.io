# Pre-rendered Sprite Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Phaser graphics-primitive entity rendering with pre-rendered sprite textures generated at boot time.

**Architecture:** A new `AssetRenderer` module creates offscreen canvases during BootScene, draws each asset using Canvas 2D API (ported from the approved catalog selections), and registers them as Phaser textures. Each entity file is then simplified: graphics drawing code is replaced with `scene.add.image(x, y, textureKey)`.

**Tech Stack:** Phaser 3, Canvas 2D API, ES modules

**Spec:** `docs/superpowers/specs/2026-04-02-prerendered-sprite-assets-design.md`

---

## Task 1: Create AssetRenderer with texture generation

**Files:**
- Create: `src/config/assetRenderer.js`

This is the core file. It contains a helper to create textures and all drawing functions ported from the catalog at game-appropriate sizes.

- [ ] **Step 1: Create the AssetRenderer module with helper and all draw functions**

```js
// src/config/assetRenderer.js

/**
 * Pre-renders all game entity sprites to Phaser textures at boot time.
 * Each texture is drawn on an offscreen canvas at 2x resolution,
 * then registered via scene.textures.addCanvas().
 */

function createTexture(scene, key, w, h, drawFn) {
  // Use Phaser's createCanvas API (matches existing textures.js pattern).
  // IMPORTANT: .refresh() is required to push pixels to the WebGL GPU texture.
  if (scene.textures.exists(key)) return;
  const c = scene.textures.createCanvas(key, w, h);
  const ctx = c.getContext();
  drawFn(ctx, w, h);
  c.refresh();
}

// ── DESTROYER (Classic Frigate) ──────────────────────────────
function drawDestroyerHull(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Hull body
  ctx.fillStyle = '#607d8b';
  ctx.beginPath();
  ctx.moveTo(cx + 32, cy);
  ctx.lineTo(cx + 20, cy - 8);
  ctx.lineTo(cx - 15, cy - 9);
  ctx.lineTo(cx - 25, cy - 6);
  ctx.lineTo(cx - 25, cy + 6);
  ctx.lineTo(cx - 15, cy + 9);
  ctx.lineTo(cx + 20, cy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Waterline
  ctx.strokeStyle = '#37474f';
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 2);
  ctx.lineTo(cx + 28, cy + 2);
  ctx.stroke();
  // Bridge
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(cx - 8, cy - 13, 16, 8);
  ctx.fillStyle = '#90caf9';
  ctx.fillRect(cx - 6, cy - 12, 3, 3);
  ctx.fillRect(cx - 1, cy - 12, 3, 3);
  ctx.fillRect(cx + 4, cy - 12, 3, 3);
  // Funnel
  ctx.fillStyle = '#37474f';
  ctx.fillRect(cx + 2, cy - 17, 4, 5);
  ctx.fillStyle = '#ff8a65';
  ctx.fillRect(cx + 2, cy - 17, 4, 1);
  // Blue accent stripe
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 23, cy - 8);
  ctx.lineTo(cx + 18, cy - 8);
  ctx.stroke();
}

function drawDestroyerTurret(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = '#78909c';
  ctx.beginPath();
  ctx.arc(cx - 4, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Barrel (pointing right = 0 degrees, will be rotated by Phaser)
  ctx.fillStyle = '#78909c';
  ctx.fillRect(cx - 4, cy - 1.5, 14, 3);
  ctx.fillRect(cx - 4, cy + 0.5, 14, 3);
  // Barrel tip
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(cx + 8, cy - 2.5, 3, 5);
}

// ── TANKER (Pixel Barge) ─────────────────────────────────────
function drawTanker(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.imageSmoothingEnabled = false;
  const px = 3;
  const drawPx = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x * px, cy + y * px, px, px); };
  // Hull
  for (let x = -10; x <= 10; x++) { drawPx(x, 0, '#78909c'); drawPx(x, 1, '#78909c'); drawPx(x, 2, '#607d8b'); }
  for (let x = -9; x <= 9; x++) { drawPx(x, -1, '#90a4ae'); drawPx(x, 3, '#607d8b'); }
  drawPx(11, 0, '#90a4ae'); drawPx(11, 1, '#90a4ae');
  // Orange cargo
  for (let x = -6; x <= 6; x++) { drawPx(x, -1, '#e65100'); drawPx(x, -2, '#ff8f00'); }
  // Bridge
  drawPx(-9, -2, '#546e7a'); drawPx(-8, -2, '#546e7a'); drawPx(-9, -3, '#546e7a'); drawPx(-8, -3, '#90caf9');
}

// ── OIL RIG (Derrick Platform) ───────────────────────────────
function drawOilRig(ctx, w, h) {
  const cx = w / 2, cy = h * 0.6;
  // Platform
  ctx.fillStyle = '#607d8b';
  ctx.fillRect(cx - 20, cy, 40, 6);
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 20, cy, 40, 1);
  // Support legs
  ctx.strokeStyle = '#78909c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 6); ctx.lineTo(cx - 20, cy + 20);
  ctx.moveTo(cx - 6, cy + 6); ctx.lineTo(cx - 8, cy + 20);
  ctx.moveTo(cx + 6, cy + 6); ctx.lineTo(cx + 8, cy + 20);
  ctx.moveTo(cx + 16, cy + 6); ctx.lineTo(cx + 20, cy + 20);
  ctx.stroke();
  // Derrick tower
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy); ctx.lineTo(cx, cy - 26);
  ctx.moveTo(cx + 8, cy); ctx.lineTo(cx, cy - 26);
  ctx.stroke();
  // Cross braces
  for (let i = 1; i <= 3; i++) {
    const bY = cy - i * 6;
    const bW = 8 - i * 1.5;
    ctx.beginPath(); ctx.moveTo(cx - bW, bY); ctx.lineTo(cx + bW, bY); ctx.stroke();
  }
  // Top beacon
  ctx.fillStyle = '#42a5f5';
  ctx.fillRect(cx - 2, cy - 28, 4, 3);
  // Pump arm
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 2);
  ctx.lineTo(cx + 22, cy - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 22, cy - 8, 2.5, 0, Math.PI * 2);
  ctx.stroke();
}

// ── AIR DEFENSE (CIWS Turret) ────────────────────────────────
function drawAirDefenseBase(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = '#1a237e';
  ctx.fillRect(cx - 14, cy - 14, 28, 28);
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 14, cy - 14, 28, 28);
  ctx.fillStyle = '#283593';
  ctx.fillRect(cx - 10, cy - 10, 20, 20);
  ctx.fillStyle = '#1565c0';
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
}

function drawAirDefenseGun(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Gun barrel
  ctx.fillStyle = '#78909c';
  ctx.fillRect(cx - 1, cy - 14, 2, 12);
  ctx.fillRect(cx - 3, cy - 16, 6, 4);
  // Radar arc
  ctx.strokeStyle = '#82b1ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 8, -Math.PI, 0);
  ctx.stroke();
}

// ── MISSILE LAUNCHER (Mobile TEL) ────────────────────────────
function drawMissileLauncherBody(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Truck body
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(cx - 20, cy - 4, 30, 12);
  ctx.strokeStyle = '#795548';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 20, cy - 4, 30, 12);
  // Cab
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(cx - 24, cy - 2, 6, 10);
  // Wheels
  ctx.fillStyle = '#212121';
  ctx.beginPath(); ctx.arc(cx - 14, cy + 10, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy + 10, 3, 0, Math.PI * 2); ctx.fill();
}

function drawMissileLauncherRail(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Rail
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(cx - w / 2 + 2, cy - 2, w - 4, 4);
  // Missile on rail
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(cx + 4, cy - 1.5, 12, 3);
  // Nose cone
  ctx.fillStyle = '#ff8a65';
  ctx.beginPath();
  ctx.moveTo(cx + 16, cy - 1.5);
  ctx.lineTo(cx + 20, cy);
  ctx.lineTo(cx + 16, cy + 1.5);
  ctx.fill();
}

// ── CRUISE MISSILE (Pixel Rocket) ────────────────────────────
function drawCruiseMissile(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.imageSmoothingEnabled = false;
  const px = 2;
  const drawPx = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x * px, cy + y * px, px, px); };
  // Body
  for (let x = -4; x <= 4; x++) drawPx(x, 0, '#cc3333');
  for (let x = -3; x <= 3; x++) { drawPx(x, -1, '#b71c1c'); drawPx(x, 1, '#b71c1c'); }
  // Nose
  drawPx(5, 0, '#ff6600'); drawPx(6, 0, '#ffab00');
  // Fins
  drawPx(-5, -2, '#7f0000'); drawPx(-5, 2, '#7f0000');
  // Trail stub
  drawPx(-5, 0, '#ff8a65'); drawPx(-6, 0, '#ff6600');
}

// ── EXPLODING UAV (Quad Rotor) ───────────────────────────────
function drawUAV(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Central body
  ctx.fillStyle = '#607d8b';
  ctx.fillRect(cx - 5, cy - 5, 10, 10);
  ctx.strokeStyle = '#90a4ae';
  ctx.strokeRect(cx - 5, cy - 5, 10, 10);
  // Arms + rotors
  ctx.strokeStyle = '#78909c';
  ctx.lineWidth = 2;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * 5, cy + dy * 5);
    ctx.lineTo(cx + dx * 14, cy + dy * 14);
    ctx.stroke();
    ctx.fillStyle = '#90a4ae';
    ctx.beginPath();
    ctx.arc(cx + dx * 14, cy + dy * 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2;
  });
  // Payload
  ctx.fillStyle = '#ef5350';
  ctx.beginPath(); ctx.arc(cx, cy + 2, 3, 0, Math.PI * 2); ctx.fill();
}

// ── NAVAL MINE (Neon Hazard) ─────────────────────────────────
function drawMine(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.shadowColor = '#ef5350';
  ctx.shadowBlur = 6;
  ctx.strokeStyle = '#ef5350';
  ctx.lineWidth = 1.5;
  // Body sphere
  ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.stroke();
  // Horn spikes
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Warning ring
  ctx.shadowBlur = 14;
  ctx.strokeStyle = 'rgba(239,83,80,0.4)';
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── IRGC MISSILE projectile (Pixel Shot) ─────────────────────
function drawProjMissile(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.imageSmoothingEnabled = false;
  const px = 3;
  const drawPx = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x * px, cy + y * px, px, px); };
  drawPx(0, 0, '#ff4444'); drawPx(1, 0, '#ff6600'); drawPx(2, 0, '#ffab00');
  drawPx(-1, 0, '#cc3333');
  drawPx(-2, 0, 'rgba(255,68,0,0.5)');
}

// ── COALITION SHELL projectile (Neon Bolt) ───────────────────
function drawProjShell(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  ctx.shadowColor = '#42a5f5';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#42a5f5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy);
  ctx.lineTo(cx + 4, cy);
  ctx.stroke();
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#42a5f5';
  ctx.beginPath(); ctx.arc(cx + 4, cy, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

// ── COALITION SUBMARINE ──────────────────────────────────────
function drawSubmarine(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  // Elongated teardrop hull
  ctx.fillStyle = '#546e7a';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + 18, cy);
  ctx.lineTo(cx + 12, cy - 5);
  ctx.lineTo(cx - 14, cy - 5);
  ctx.lineTo(cx - 18, cy);
  ctx.lineTo(cx - 14, cy + 5);
  ctx.lineTo(cx + 12, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#78909c';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Conning tower
  ctx.fillStyle = '#455a64';
  ctx.fillRect(cx - 2, cy - 8, 6, 4);
  // Periscope
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 8);
  ctx.lineTo(cx + 2, cy - 14);
  ctx.stroke();
}

// ── PUBLIC API ───────────────────────────────────────────────
export function generateAll(scene) {
  createTexture(scene, 'spr_destroyer_hull', 80, 40, drawDestroyerHull);
  createTexture(scene, 'spr_destroyer_turret', 30, 14, drawDestroyerTurret);
  createTexture(scene, 'spr_tanker', 80, 40, drawTanker);
  createTexture(scene, 'spr_oil_rig', 72, 80, drawOilRig);
  createTexture(scene, 'spr_air_defense_base', 56, 56, drawAirDefenseBase);
  createTexture(scene, 'spr_air_defense_gun', 28, 36, drawAirDefenseGun);
  createTexture(scene, 'spr_missile_launcher_body', 60, 30, drawMissileLauncherBody);
  createTexture(scene, 'spr_missile_launcher_rail', 44, 12, drawMissileLauncherRail);
  createTexture(scene, 'spr_cruise_missile', 32, 14, drawCruiseMissile);
  createTexture(scene, 'spr_uav', 40, 40, drawUAV);
  createTexture(scene, 'spr_mine', 48, 48, drawMine);
  createTexture(scene, 'spr_proj_missile', 24, 10, drawProjMissile);
  createTexture(scene, 'spr_proj_shell', 28, 12, drawProjShell);
  createTexture(scene, 'spr_submarine', 50, 24, drawSubmarine);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/config/assetRenderer.js
git commit -m "feat: add AssetRenderer with all sprite drawing functions"
```

---

## Task 2: Integrate AssetRenderer into BootScene

**Files:**
- Modify: `src/scenes/BootScene.js` (line 1 imports, line ~179 after asset loading)

- [ ] **Step 1: Add import and call generateAll at end of preload**

Add at top of `src/scenes/BootScene.js`:
```js
import { generateAll } from '../config/assetRenderer.js';
```

Add at the very start of `create()`, before the boot message typewriter code:
```js
    // ── Generate sprite textures (before any entities are created) ──
    generateAll(this);
```

Note: Placed in `create()` to match the existing `ensureTextures()` pattern (called from entity constructors during the Game scene's create phase). The TextureManager is global — textures persist across scene transitions from Boot → Game.

- [ ] **Step 2: Verify boot sequence still works**

Run the game in browser, confirm the boot sequence plays normally and the game scene loads without errors. Open console — no texture-related errors should appear.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.js
git commit -m "feat: integrate AssetRenderer into boot sequence"
```

---

## Task 3: Convert Projectile to sprites

**Files:**
- Modify: `src/entities/Projectile.js`

The projectile currently draws a glow circle, missile body path, and white core using graphics. Replace with a single sprite image.

- [ ] **Step 1: Replace graphics body with sprite**

Replace the constructor's graphics drawing section (lines 15-43 approximately — everything creating `bodyGfx`) with:

```js
    // ── Sprite body ──
    const textureKey = side === 'irgc' ? 'spr_proj_missile' : 'spr_proj_shell';
    this.bodySprite = scene.add.image(0, 0, textureKey).setOrigin(0.5);
    this.add(this.bodySprite);
```

Remove the old `this.bodyGfx = scene.add.graphics()` block and all its drawing code (fillCircle, beginPath, moveTo, lineTo, closePath, fill for the missile body shape, the bright core circle).

Keep the trail emitters (`trailEmitter` and `smokeTrail`) and the pulsing glow tween — but retarget the tween from `this.bodyGfx` to `this.bodySprite`:

```js
    // Pulsing glow
    scene.tweens.add({
      targets: this.bodySprite,
      alpha: { from: 0.7, to: 1 },
      duration: 100,
      yoyo: true,
      repeat: -1,
    });
```

- [ ] **Step 2: Update the update() method**

In `update()`, remove any line that references `this.bodyGfx`. The sprite rotation is handled the same way — `this.bodySprite.rotation = angle` or set the container rotation since the sprite is a child.

The container rotation is already set in the current code via:
```js
this.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
```
Since `bodySprite` is a child of the container, it rotates automatically. No change needed here.

- [ ] **Step 3: Update all `bodyGfx` references**

Search Projectile.js for ALL remaining references to `bodyGfx` and replace with `bodySprite`. The entity relies on Container's `super.destroy()` for cleanup (no explicit `.destroy()` calls needed). Key places to check:
- Any guard checks like `if (this.bodyGfx?.active)` → `if (this.bodySprite?.active)`
- Any tween targets → retarget to `this.bodySprite`

Keep all particle effects (impact ring, flash, sparks) unchanged.

- [ ] **Step 4: Verify visually**

Run the game, deploy a destroyer and wait for it to fire. Coalition shells should appear as cyan neon bolts. Let enemy launchers fire — IRGC missiles should appear as pixel-art red shots. Both should rotate toward targets and have trails.

- [ ] **Step 5: Commit**

```bash
git add src/entities/Projectile.js
git commit -m "feat: convert projectile rendering to pre-rendered sprites"
```

---

## Task 4: Convert Mine to sprite

**Files:**
- Modify: `src/entities/Mine.js`

- [ ] **Step 1: Replace warning graphics with sprite**

Currently the mine creates `warningGfx` and draws the mine body + spikes in `_showWarning()`. Replace with:

In the constructor, after setting properties, create the sprite hidden:
```js
    this.mineSprite = scene.add.image(0, 0, 'spr_mine').setOrigin(0.5).setAlpha(0);
    this.add(this.mineSprite);
```

In `_showWarning()`, instead of drawing graphics, reveal the sprite and add the pulsing tween:
```js
  _showWarning() {
    if (this._warned) return;
    this._warned = true;
    this.mineSprite.setAlpha(1);
    this.scene.tweens.add({
      targets: this.mineSprite,
      alpha: { from: 1, to: 0.4 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
    // Warning text
    this.warningText = this.scene.add.text(this.x, this.y - 20, '⚠ MINE', {
      fontSize: '11px', fontFamily: '"Share Tech Mono", monospace', color: '#ef5350',
    }).setOrigin(0.5).setDepth(10);
  }
```

Remove the old `warningGfx` graphics object and all its drawing code (fillCircle, fillStyle for mine body, spike circles, strokeCircle for warning ring).

- [ ] **Step 2: Update destroy/detonation and tween cleanup**

In the detonation/cleanup methods, update all `warningGfx` references:
- `this.scene?.tweens?.killTweensOf(this.warningGfx)` → `this.scene?.tweens?.killTweensOf(this.mineSprite)`
- Any `this.warningGfx?.destroy()` → `this.mineSprite?.destroy()`

The entity uses Container's `super.destroy()` for child cleanup, so explicit sprite destroy is only needed if done outside the container.

Keep all detonation effects unchanged (fire particles, flash, shockwave, damage text).

- [ ] **Step 3: Verify visually**

Run the game, wait for mines to appear. When a ship gets close, the neon wireframe mine with glowing spikes and warning ring should pulse into view.

- [ ] **Step 4: Commit**

```bash
git add src/entities/Mine.js
git commit -m "feat: convert mine rendering to neon hazard sprite"
```

---

## Task 5: Convert CruiseMissile to sprite

**Files:**
- Modify: `src/entities/CruiseMissile.js`

- [ ] **Step 1: Replace bodyGfx with sprite**

Replace the graphics body creation (lines 15-35) with:
```js
    this.bodySprite = scene.add.image(0, 0, 'spr_cruise_missile').setOrigin(0.5);
    this.add(this.bodySprite);
```

Remove the old `bodyGfx` graphics drawing code. Keep the HP bar, trail emitter, and glow pulse tween (retarget to `bodySprite`).

- [ ] **Step 2: Update rotation in update()**

The container rotation already handles missile orientation. Remove any `bodyGfx` references from update. The sprite rotates as a child of the container.

- [ ] **Step 3: Update all `bodyGfx` references**

Search CruiseMissile.js for ALL remaining `bodyGfx` references and replace with `bodySprite`:
- Guard checks: `if (this.bodyGfx?.active)` → `if (this.bodySprite?.active)`
- Tween targets in `takeDamage()` or flash effects → retarget to `this.bodySprite`

No explicit `.destroy()` calls needed — Container handles child cleanup. Keep all impact/intercepted effects.

- [ ] **Step 4: Verify and commit**

```bash
git add src/entities/CruiseMissile.js
git commit -m "feat: convert cruise missile to pixel rocket sprite"
```

---

## Task 6: Convert ExplodingUAV to sprite

**Files:**
- Modify: `src/entities/ExplodingUAV.js`

- [ ] **Step 1: Replace bodyGfx with sprite**

Replace the delta-wing graphics drawing (lines 15-28) with:
```js
    this.bodySprite = scene.add.image(0, 0, 'spr_uav').setOrigin(0.5);
    this.add(this.bodySprite);
```

The blinking red light: add a small red circle graphic overlaid on the sprite center:
```js
    this.blinkLight = scene.add.circle(0, 2, 2, 0xef5350).setAlpha(1);
    this.add(this.blinkLight);
    scene.tweens.add({
      targets: this.blinkLight,
      alpha: { from: 1, to: 0.3 },
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
```

Remove old `bodyGfx` and its blink tween. Keep trail emitter.

- [ ] **Step 2: Update all `bodyGfx` references**

Search ExplodingUAV.js for ALL remaining `bodyGfx` references and replace with `bodySprite`:
- Guard checks → retarget to `bodySprite`
- No explicit `.destroy()` calls needed — Container handles cleanup

Keep all impact/intercepted effects.

- [ ] **Step 3: Verify and commit**

```bash
git add src/entities/ExplodingUAV.js
git commit -m "feat: convert UAV to quad rotor sprite"
```

---

## Task 7: Convert Ship base class and Tanker to sprites

**Files:**
- Modify: `src/entities/Ship.js`
- Modify: `src/entities/Tanker.js`

Ship is the base class. We need to replace `_drawHull()` with a sprite, while keeping HP bar, wake, and destruction effects.

- [ ] **Step 1: Modify Ship.js constructor**

Replace the hull graphics creation with a sprite. The Ship base class uses `'spr_tanker'` by default (since generic Ship doesn't exist in gameplay — only Tanker and Destroyer inherit it). Add a `spriteKey` parameter:

At the top of the constructor, after `super(scene, x, y)`:
```js
    const spriteKey = stats._spriteKey || 'spr_tanker';
    this.hullSprite = scene.add.image(0, 0, spriteKey).setOrigin(0.5);
    this.add(this.hullSprite);
```

Remove the old `this.hullGfx = scene.add.graphics()` creation and the `this._drawHull(this.hullGfx)` call. Remove the `_drawHull(gfx)` method entirely from Ship.js.

Keep the HP bar system, wake emitter, and all destruction/damage effects unchanged.

- [ ] **Step 2: Update ALL `hullGfx` references in Ship.js**

Search Ship.js for every remaining `hullGfx` reference. Critical locations:

**`takeDamage()` (~line 152)** — damage flash tween targets `this.hullGfx`:
```js
// BEFORE (broken):
if (this.hullGfx && this.hullGfx.active) {
  this.scene.tweens.add({ targets: this.hullGfx, alpha: ... });
}
// AFTER (fixed):
if (this.hullSprite && this.hullSprite.active) {
  this.scene.tweens.add({ targets: this.hullSprite, alpha: ... });
}
```

**`update()` rotation (~line 125)** — the current code already sets `this.angle = angle` (container rotation), NOT `hullGfx.rotation`. No change needed here.

No explicit `.destroy()` calls exist for `hullGfx` — Container's `super.destroy()` handles cleanup.

- [ ] **Step 4: Modify Tanker.js**

Tanker currently overrides `_drawHull()`. Since we removed that method, Tanker just needs to pass the sprite key. In Tanker's constructor, before `super()`, or right after, set the sprite key:

The simplest approach — in `src/config/units.js`, add `_spriteKey` to each unit config:
```js
// In COALITION_UNITS.TANKER:
_spriteKey: 'spr_tanker',
```

Or, override in Tanker constructor after super:
```js
constructor(scene, x, y, stats) {
  super(scene, x, y, { ...stats, _spriteKey: 'spr_tanker' });
}
```

Remove the `_drawHull(gfx)` override method entirely from Tanker.js.

Keep all scoring effects (onReachedEnd) unchanged.

**CoalitionSubmarine** also extends Ship and overrides `_drawHull()`. In its constructor, pass the sprite key explicitly:
```js
constructor(scene, x, y, stats) {
  super(scene, x, y, { ...stats, _spriteKey: 'spr_submarine' });
  // ... rest of constructor unchanged
}
```
Remove its `_drawHull(gfx)` override method (it becomes dead code). The submarine texture is registered by AssetRenderer.

- [ ] **Step 5: Verify and commit**

Deploy a tanker — should appear as a pixel barge with orange cargo blocks. Watch it navigate, rotate, take damage (HP bar), and arrive at endpoint with scoring effects.

```bash
git add src/entities/Ship.js src/entities/Tanker.js
git commit -m "feat: convert ship/tanker hull rendering to sprites"
```

---

## Task 8: Convert OilRig to sprite

**Files:**
- Modify: `src/entities/OilRig.js`

- [ ] **Step 1: Replace graphics structure with sprite**

Replace the entire graphics drawing block in the constructor (platform, derrick, cross braces, legs) with:
```js
    this.rigSprite = scene.add.image(0, 0, 'spr_oil_rig').setOrigin(0.5);
    this.add(this.rigSprite);
```

Remove the `pumpArm` graphics and its rocking tween. Replace with a subtle breathing alpha tween on the whole sprite:
```js
    scene.tweens.add({
      targets: this.rigSprite,
      alpha: { from: 1, to: 0.85 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
```

**Update the `this.add([...])` call** — replace `this.gfx` with `this.rigSprite` and remove `this.pumpArm` from the array.

Keep the `glowRing` graphics (it pulses independently), HP bar, storage indicators, collect prompt, and all collection/destruction effects unchanged.

- [ ] **Step 2: Update ALL `this.gfx` references in OilRig.js**

Search OilRig.js for every remaining `this.gfx` reference. Critical locations:

**`showCollectionEffect()` (~line 230)** — collection flash tween:
```js
// BEFORE: if (this.gfx && this.gfx.active) { tweens.add({ targets: this.gfx ... })
// AFTER:  if (this.rigSprite && this.rigSprite.active) { tweens.add({ targets: this.rigSprite ... })
```

**`takeDamage()` (~line 256)** — damage flash tween:
```js
// BEFORE: if (this.gfx && this.gfx.active) { tweens.add({ targets: this.gfx ... })
// AFTER:  if (this.rigSprite && this.rigSprite.active) { tweens.add({ targets: this.rigSprite ... })
```

Also remove any `this.pumpArm.destroy()` in the destroy/cleanup path.

- [ ] **Step 3: Verify and commit**

Place an oil rig — should appear as the detailed derrick platform. Glow ring pulses. Tap to collect works. Damage flash works.

```bash
git add src/entities/OilRig.js
git commit -m "feat: convert oil rig to derrick platform sprite"
```

---

## Task 9: Convert Destroyer to composite sprites

**Files:**
- Modify: `src/entities/Destroyer.js`
- Modify: `src/config/units.js` (add _spriteKey)

Destroyer is a 3-layer composite: hull + turret (rotates toward target) + radar (continuous rotation).

- [ ] **Step 1: Set sprite key and remove hull override**

In `src/config/units.js`, add to COALITION_UNITS.DESTROYER:
```js
_spriteKey: 'spr_destroyer_hull',
```

In Destroyer.js, remove the `_drawHull(gfx)` override method. The Ship base class will now use `spr_destroyer_hull`.

- [ ] **Step 2: Replace turret graphics with sprite**

Replace the `turretGfx` creation and `_drawTurret()` method with:
```js
    this.turretSprite = scene.add.image(8, 0, 'spr_destroyer_turret').setOrigin(0.37, 0.5);
    this.add(this.turretSprite);
```

The origin `(0.3, 0.5)` places the rotation pivot near the turret base circle (left-center of the texture), so the barrel sweeps outward when rotating.

In the update method, replace ALL `turretGfx` references. The existing code uses **degrees** (`.angle`), not radians:
```js
// BEFORE: if (target && this.turretGfx && this.turretGfx.active) { this.turretGfx.angle = worldAngle - this.angle; }
// AFTER:  if (target && this.turretSprite && this.turretSprite.active) { this.turretSprite.angle = worldAngle - this.angle; }
```

- [ ] **Step 3: Update `_muzzleFlash()` references**

`_muzzleFlash()` has TWO critical `turretGfx` references that will silently break:
```js
// Line ~151 — guard check:
// BEFORE: if (!this.scene || !this.turretGfx?.active) return;
// AFTER:  if (!this.scene || !this.turretSprite?.active) return;

// Line ~155 — rotation for flash positioning:
// BEFORE: const turretRad = this.turretGfx.rotation + shipRad;
// AFTER:  const turretRad = this.turretSprite.rotation + shipRad;
```

Without this fix, muzzle flash silently fails (the guard returns early since `turretGfx` is undefined).

- [ ] **Step 4: Simplify radar**

Keep the radar as a lightweight graphics object (not worth a texture). It's just a rotating line:
```js
    this.radarGfx = scene.add.graphics();
    this.radarGfx.lineStyle(1, 0x82b1ff, 0.6);
    this.radarGfx.lineBetween(0, 0, 0, -6);
    this.add(this.radarGfx);
    scene.tweens.add({
      targets: this.radarGfx,
      angle: 360,
      duration: 2000,
      repeat: -1,
    });
```

Remove the old complex radar drawing with arc and multiple graphics calls.

- [ ] **Step 5: Remove dead methods**

Delete `_drawHull(gfx)` (if still present) and `_drawTurret(gfx)`. No explicit `.destroy()` calls exist — Container handles cleanup.

- [ ] **Step 6: Verify and commit**

Deploy a destroyer — hull should be the Classic Frigate with bridge/funnel/blue accent. Turret should rotate toward enemies. Radar line should spin continuously. Muzzle flash should still work.

```bash
git add src/entities/Destroyer.js src/config/units.js
git commit -m "feat: convert destroyer to composite sprite (hull + turret)"
```

---

## Task 10: Convert AirDefense to composite sprites

**Files:**
- Modify: `src/entities/AirDefense.js`

- [ ] **Step 1: Replace base graphics with sprite**

Replace `baseGfx` creation and drawing with:
```js
    this.baseSprite = scene.add.image(0, 0, 'spr_air_defense_base').setOrigin(0.5);
    this.add(this.baseSprite);
```

- [ ] **Step 2: Replace radar with gun sprite**

Replace `radarGfx` (which had the rotating radar dish) with the gun assembly sprite:
```js
    this.gunSprite = scene.add.image(0, -4, 'spr_air_defense_gun').setOrigin(0.5, 0.7);
    this.add(this.gunSprite);
```

The origin `(0.5, 0.7)` places the pivot near the bottom center so the gun barrel sweeps upward when rotating.

In update(), rotate the gun toward the current target:
```js
    if (target) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      this.gunSprite.rotation = angle + Math.PI / 2; // adjust for upward-pointing texture
    }
```

Remove old `radarGfx` rotation tween and complex drawing code.

- [ ] **Step 3: Update `update()` — move target finding before fire-rate check**

Currently `update()` only finds a target when the fire-rate cooldown allows. For continuous gun aiming, find the target FIRST, rotate the gun, THEN check fire rate:

```js
update() {
  if (!this.active || this.hp <= 0) return;
  const target = this._findAirTarget();
  // Continuous aiming — rotate gun even when not firing
  if (target && this.gunSprite) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.gunSprite.rotation = angle + Math.PI / 2;
  }
  // Fire rate gated (use scene clock, not Date.now())
  const now = this.scene.time.now;
  if (now - this.lastFired < this.getEffectiveFireRate()) return;
  if (!target) return;
  this.lastFired = now;
  // Fire interceptor (same logic as original — no _fire() method exists)
  this.scene.fireProjectile(this.x, this.y, target, PROJECTILES.INTERCEPTOR, 'coalition');
  // Muzzle flash
  const flash = this.scene.add.circle(this.x, this.y - 8, 4, 0x00e5ff, 0.8).setDepth(12);
  this.scene.tweens.add({
    targets: flash, scaleX: 2.5, scaleY: 2.5, alpha: 0,
    duration: 200, onComplete: () => flash.destroy(),
  });
}
```

- [ ] **Step 4: Update ALL `baseGfx` references in AirDefense.js**

**`takeDamage()` (~line 117)** — damage flash tween:
```js
// BEFORE: if (this.baseGfx?.active) { tweens.add({ targets: this.baseGfx ... })
// AFTER:  if (this.baseSprite?.active) { tweens.add({ targets: this.baseSprite ... })
```

Keep range circle, HP bar, muzzle flash, destruction effects. No explicit `.destroy()` needed.

- [ ] **Step 5: Verify and commit**

```bash
git add src/entities/AirDefense.js
git commit -m "feat: convert air defense to CIWS turret composite sprite"
```

---

## Task 11: Convert MissileLauncher to composite sprites

**Files:**
- Modify: `src/entities/MissileLauncher.js`

- [ ] **Step 1: Replace base graphics with truck sprite**

Replace `baseGfx` and `_drawBase()` with:
```js
    this.bodySprite = scene.add.image(0, 0, 'spr_missile_launcher_body').setOrigin(0.5);
    this.add(this.bodySprite);
```

Remove the hexagonal base drawing code and `_drawBase(gfx)` method entirely.

- [ ] **Step 2: Replace launcher barrel with rail sprite**

Replace `launcherGfx` and `_drawLauncher()` with:
```js
    this.railSprite = scene.add.image(4, -4, 'spr_missile_launcher_rail').setOrigin(0.1, 0.5);
    this.add(this.railSprite);
```

The origin `(0.1, 0.5)` places the pivot at the mount point so the rail rotates from its base.

In update(), replace ALL `launcherGfx` references including the guard check:
```js
// BEFORE: if (target && this.launcherGfx && this.launcherGfx.active) { this.launcherGfx.angle = angle; }
// AFTER:  if (target && this.railSprite && this.railSprite.active) { this.railSprite.angle = angle - this.angle; }
```

Note the `- this.angle` correction — since `railSprite` is a Container child, subtract the container's rotation for correct local angle.

Remove `_drawLauncher(gfx)` method.

- [ ] **Step 3: Update ALL `baseGfx` references**

Search MissileLauncher.js for every `baseGfx` reference:

**`_fireMuzzleFlash()` (~line 252)** — recoil shake guard:
```js
// BEFORE: if (this.baseGfx && this.baseGfx.active) { tweens.add({ targets: this.baseGfx ... })
// AFTER:  if (this.bodySprite && this.bodySprite.active) { tweens.add({ targets: this.bodySprite ... })
```

**`takeDamage()` (~line 287)** — damage flash tween:
```js
// BEFORE: if (this.baseGfx && this.baseGfx.active) { tweens.add({ targets: this.baseGfx ... })
// AFTER:  if (this.bodySprite && this.bodySprite.active) { tweens.add({ targets: this.bodySprite ... })
```

- [ ] **Step 4: Keep auxiliary graphics**

Keep the `rangeGfx` (dashed circle), `warningGlow` (red pulse), HP bar. No explicit `.destroy()` calls needed — Container handles cleanup.

- [ ] **Step 5: Verify and commit**

Let the game run until IRGC spawns a missile launcher. Should appear as a brown truck with rotating launcher rail. Rail should point at nearest ship. Firing should produce dual muzzle flash.

```bash
git add src/entities/MissileLauncher.js
git commit -m "feat: convert missile launcher to mobile TEL composite sprite"
```

---

## Task 12: Restyle particle effects to match selected aesthetics

**Files:**
- Modify: `src/entities/Ship.js` (wake emitter config)
- Modify: `src/systems/CombatManager.js` (if explosion effects are centralized)

- [ ] **Step 1: Restyle wake particles to Neon Trail**

In Ship.js, find the wake emitter creation and update the config to match the neon trail style:
```js
    this.wakeEmitter = scene.add.particles(0, 0, 'wake', {
      speed: { min: 2, max: 8 },
      lifespan: { min: 200, max: 400 },
      alpha: { start: 0.5, end: 0 },
      scale: { start: 0.6, end: 0.1 },
      tint: 0x82b1ff,
      frequency: 60,
      blendMode: 'ADD',
    });
```

Key changes: add `tint: 0x82b1ff` (neon blue), add `blendMode: 'ADD'` for the glowing effect, reduce lifespan for sharper trails.

- [ ] **Step 2: Restyle explosion particles to Fire Burst**

Find explosion effect creation (in Ship.js `_destroy()` and similar methods across entities). Update the fire particle tint to use warm gradient colors:
```js
    // In fire burst sections, add tint for warmer palette:
    tint: [0xfff8e1, 0xff8f00, 0xff6600, 0xef5350],
```

This gives particles the white-core → orange → red-orange gradient matching the Fire Burst selection.

- [ ] **Step 3: Restyle projectile trails**

In Projectile.js, the trail emitters already have side-specific tints. Verify they match:
- IRGC trails: `tint: 0xff4400` (orange-red, matches pixel shot)
- Coalition trails: `tint: 0x42a5f5` with `blendMode: 'ADD'` (neon blue, matches neon bolt)

Add `blendMode: 'ADD'` to coalition trail if not present.

- [ ] **Step 4: Verify all effects and commit**

Watch ships move (neon blue wake), see explosions (warm fire burst), watch projectiles fly (colored trails).

```bash
git add src/entities/Ship.js src/entities/Projectile.js
git commit -m "feat: restyle particle effects to match selected asset aesthetics"
```

---

## Task 13: Final cleanup and verification

**Files:**
- All modified entity files

- [ ] **Step 1: Remove dead code**

Search **migrated** entity files for any remaining references to old graphics objects (`hullGfx`, `bodyGfx`, `baseGfx`, `turretGfx`, `launcherGfx`, `warningGfx`). Remove any orphaned methods (`_drawHull`, `_drawBase`, `_drawLauncher`, `_drawTurret`).

**EXCLUDE** from cleanup: any entity files NOT covered by this plan (e.g., `FastBoat.js`, `Airfield.js`, `F22.js`, `MiniSubmarine.js`) — these still use graphics primitives and should not be touched.

- [ ] **Step 2: Full playthrough verification**

Play a complete game session:
- Deploy all 4 unit types (oil rig, tanker, destroyer, air defense)
- Watch IRGC spawn missile launchers, cruise missiles, UAVs, mines
- Verify all sprites render correctly
- Verify rotations (turrets, missiles, ships)
- Verify HP bars still work
- Verify particle effects (wake, muzzle flash, explosions, trails)
- Verify collection effects on oil rigs
- Verify scoring effects on tankers
- Reach game over — verify GameOverScene still works
- Check browser console for any errors or warnings

- [ ] **Step 3: Commit final cleanup**

```bash
git add -A
git commit -m "chore: remove dead graphics code after sprite migration"
```
