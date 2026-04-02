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

// ── OIL RIG — IRGC (Red Variant) ─────────────────────────────
function drawOilRigIRGC(ctx, w, h) {
  const cx = w / 2, cy = h * 0.6;
  // Platform
  ctx.fillStyle = '#8b4040';
  ctx.fillRect(cx - 20, cy, 40, 6);
  ctx.strokeStyle = '#ef5350';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 20, cy, 40, 1);
  // Support legs
  ctx.strokeStyle = '#905050';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 6); ctx.lineTo(cx - 20, cy + 20);
  ctx.moveTo(cx - 6, cy + 6); ctx.lineTo(cx - 8, cy + 20);
  ctx.moveTo(cx + 6, cy + 6); ctx.lineTo(cx + 8, cy + 20);
  ctx.moveTo(cx + 16, cy + 6); ctx.lineTo(cx + 20, cy + 20);
  ctx.stroke();
  // Derrick tower
  ctx.strokeStyle = '#b07070';
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
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(cx - 2, cy - 28, 4, 3);
  // Pump arm
  ctx.strokeStyle = '#ff6644';
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
  createTexture(scene, 'spr_oil_rig_irgc', 72, 80, drawOilRigIRGC);
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
