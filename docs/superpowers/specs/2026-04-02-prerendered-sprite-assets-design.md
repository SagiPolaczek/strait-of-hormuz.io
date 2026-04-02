# Pre-rendered Sprite Texture System

**Date:** 2026-04-02
**Status:** Approved

## Summary

Replace all entity rendering (currently Phaser graphics primitives) with pre-rendered sprite textures. A new `AssetRenderer` module generates canvas-based textures at boot time and registers them with Phaser's texture manager. Each entity switches from `scene.add.graphics()` to `scene.add.sprite()`.

## Selected Visual Styles

| Entity | Catalog Selection | Style |
|--------|------------------|-------|
| Destroyer | Classic Frigate | Realistic |
| Oil Tanker | Pixel Barge | Pixel Art |
| Oil Rig | Derrick Platform | Detailed |
| Air Defense | CIWS Turret | Military |
| Missile Launcher | Mobile TEL | Realistic |
| Cruise Missile | Pixel Rocket | Pixel Art |
| Exploding UAV | Quad Rotor | Compact |
| Naval Mine | Neon Hazard | Wireframe |
| IRGC Missile (projectile) | Pixel Shot | Pixel Art |
| Coalition Shell (projectile) | Neon Bolt | Wireframe |
| Explosion (effect) | Fire Burst | Detailed |
| Ship Wake (effect) | Neon Trail | Wireframe |

## Architecture

### Boot-time Texture Generation

```
BootScene.preload()
  └── AssetRenderer.generateAll(scene)
        ├── for each asset: create offscreen canvas
        ├── draw the selected visual at 2x resolution
        ├── call scene.textures.addCanvas(key, canvas)
        └── registers ~15 texture keys
```

### New File

**`src/config/assetRenderer.js`** contains:
- All canvas drawing functions (ported from the approved catalog selections)
- `generateAll(scene)` entry point called from BootScene
- Helper: `createTexture(scene, key, width, height, drawFn)` — creates canvas, draws, registers

### Texture Registry

| Key | Description | Canvas Size | Display Size |
|-----|-------------|-------------|--------------|
| `spr_destroyer_hull` | Frigate hull body | 160x80 | 80x40 |
| `spr_destroyer_turret` | Gun barrel + base circle | 48x24 | 24x12 |
| `spr_tanker` | Pixel barge full hull | 160x80 | 80x40 |
| `spr_oil_rig` | Derrick platform with tower | 144x160 | 72x80 |
| `spr_air_defense_base` | CIWS square platform | 112x112 | 56x56 |
| `spr_air_defense_gun` | Rotating barrel + radar arc | 48x60 | 24x30 |
| `spr_missile_launcher_body` | TEL truck chassis | 120x60 | 60x30 |
| `spr_missile_launcher_rail` | Launcher rail with missile | 80x24 | 40x12 |
| `spr_cruise_missile` | Pixel rocket body | 72x24 | 36x12 |
| `spr_uav` | Quad rotor with arms | 72x72 | 36x36 |
| `spr_mine` | Neon wireframe mine + spikes | 80x80 | 40x40 |
| `spr_proj_missile` | Pixel shot projectile | 48x16 | 24x8 |
| `spr_proj_shell` | Neon bolt projectile | 40x16 | 20x8 |

All canvases rendered at 2x internal resolution for retina crispness, displayed at 1x via Phaser sprite scaling.

## Entity Modifications

### Destroyer (3-layer composite)

- **Hull sprite** — `spr_destroyer_hull`, rotates with movement direction
- **Turret child sprite** — `spr_destroyer_turret`, positioned at bow, rotates independently toward current target
- **Radar child sprite** — small rotating line, kept as lightweight graphics (not worth a separate texture)
- **Preserved**: HP bar (graphics, dynamic width/color), wake particle emitter, muzzle flash particles, destruction FX

### Oil Tanker (single sprite)

- **Hull sprite** — `spr_tanker`, rotates with movement direction
- **Preserved**: HP bar, wake particles, scoring text popup ("$$$", "+{amount}"), destruction FX

### Oil Rig (single sprite)

- **Platform sprite** — `spr_oil_rig`, static position, pump arm baked in as still frame
- Pump animation replaced with subtle alpha pulse tween on the whole sprite (breathing effect)
- **Preserved**: HP bar, blue glow ring (graphics tween), oil storage bar, "TAP" prompt, collection golden burst FX, destruction FX

### Air Defense (2-layer composite)

- **Base sprite** — `spr_air_defense_base`, static
- **Gun sprite** — `spr_air_defense_gun`, child of base, rotates toward incoming threats
- **Preserved**: HP bar, range circle (graphics, toggled), cyan muzzle flash particles, destruction FX

### Missile Launcher (2-layer composite)

- **Body sprite** — `spr_missile_launcher_body`, static position
- **Rail sprite** — `spr_missile_launcher_rail`, child of body, rotates toward target
- **Preserved**: HP bar, range circle (dashed red, animated), warning glow pulse, dual muzzle flash, smoke puff, destruction FX

### Cruise Missile (single sprite)

- **Body sprite** — `spr_cruise_missile`, rotates with flight path
- Alpha pulse tween on sprite for glow effect (replaces glow aura graphics)
- **Preserved**: HP bar (red), smoke trail particle emitter, impact ring + flash FX, "INTERCEPTED" text

### Exploding UAV (single sprite)

- **Body sprite** — `spr_uav`, rotates with flight path
- Red blinking light: tiny graphics circle overlaid with alpha tween
- **Preserved**: smoke trail particles, impact FX, "INTERCEPTED" text

### Naval Mine (single sprite)

- **Mine sprite** — `spr_mine`, static position, contains wireframe body + spike circles + outer warning ring
- Pulsing effect: alpha tween on sprite (1.0 to 0.4)
- Hidden state: sprite alpha = 0, revealed on detection
- **Preserved**: detonation water column FX, shockwave ring, damage text, "CLEARED" text

### Projectiles (single sprites)

- **IRGC Missile** — `spr_proj_missile`, rotates toward target
- **Coalition Shell** — `spr_proj_shell`, rotates toward target
- **Preserved**: trail particle emitters (restyled — see Effects below), impact ring + spark FX

## Effects (Not Sprites)

Explosion and wake remain particle/graphics-based (they're animated, not static). Restyled to match selected aesthetics:

### Explosion (Fire Burst style)

Restyle the existing particle emitter config:
- Core flash: white (#fff8e1) expanding circle
- Mid ring: orange (#ff8f00) particles
- Outer debris: red-orange (#ff8a65, #ef5350) scattered particles
- Uses existing 'fire' and 'debris' particle textures

### Wake (Neon Trail style)

Restyle the wake particle emitter:
- Color: blue-white (#82b1ff → rgba(130,177,255,0))
- Shorter lifespan, sharper fade
- Thinner V-shape pattern
- Matches the glowing wireframe aesthetic of the HUD

### Projectile Trails

- IRGC missile trail: orange-red particles (keep current, matches pixel art)
- Coalition shell trail: cyan-blue glow particles (matches neon bolt style)

## What Stays Unchanged

- **HP bars** — dynamic width, color thresholds (green/yellow/red), drawn as graphics
- **Range circles** — dynamic, toggled per entity, drawn as graphics
- **Text popups** — damage numbers, scoring text, status labels
- **All UI** — HUD, DeploymentBar, UpgradePanel, BalanceMeterUI, SettingsModal, GameOverScene
- **Particle textures** — 'fire', 'smoke', 'flare', 'debris', 'wake' (generated programmatically at boot)
- **Map background** — loaded as image asset

## Implementation Order

1. Create `src/config/assetRenderer.js` with all draw functions and `generateAll()`
2. Call `AssetRenderer.generateAll(scene)` in BootScene.preload()
3. Modify entities one at a time (simplest first):
   a. Projectile.js (single sprite, simplest)
   b. Mine.js (single sprite)
   c. CruiseMissile.js (single sprite)
   d. ExplodingUAV.js (single sprite)
   e. Tanker.js / Ship.js (single sprite, base class change)
   f. OilRig.js (single sprite, remove pump animation)
   g. Destroyer.js (composite: hull + turret)
   h. AirDefense.js (composite: base + gun)
   i. MissileLauncher.js (composite: body + rail)
4. Restyle particle effects (explosion colors, wake colors, trail colors)
5. Verify all entities render correctly, no visual regressions
