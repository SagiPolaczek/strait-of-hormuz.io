# Gameplay Fixes — Design Spec

**Date:** 2026-04-02
**Scope:** 7 fixes across placement, combat, intel, navigation, UI, and sharing

---

## 1. Coalition Land Building Zone

**Problem:** Air Defense and Airfield deploy into water (`COALITION_DEPLOY`). They should be on land.

**Design:**
- New zone `COALITION_LAND` in `zones.js` covering Oman/UAE coastal strip (bottom-left of map, below the waterline)
- `AIR_DEFENSE` and `AIRFIELD` units in `units.js` change zone from `COALITION_DEPLOY` to `COALITION_LAND`
- `GameScene.handleMapClick` already routes placement by `unit.zone` — no changes needed there
- `ZoneManager.flashCoalitionZones` needs a new branch for `COALITION_LAND`
- `GameScene.showZoneOutlines` needs to map the new zone name

**Polygon coordinates:** Trace the Oman/UAE land area from the satellite map — roughly the area below/left of the water polygon's southern edge, from ~(6, 1250) down to the bottom-left corner, extending east along the coast.

---

## 2. IRGC Fast Boat Timing + Air Defense Targeting

**Problem:** Fast boats arrive at 2 min, before player has advanced defenses. Air Defense ignores them.

**Design:**
- Push `FAST_BOAT_START_MS` to `180000` (3 min), aligned with all other advanced threats
- Keep `MINE_START_MS` at 2 min as the first escalation step (mines are passive, not overwhelming)
- Air Defense stays air-only (interceptors vs cruise missiles/UAVs) — this is correct by design
- Destroyers are the counter to fast boats; the 3-min alignment gives players time to build them
- Update `_onAdvancedUnlock()` banner text to mention fast boats as part of the incoming threat

---

## 3. All IRGC Units Clickable with Intel

**Problem:** FastBoat and MiniSubmarine have no intel entries. Clicking them shows nothing.

**Design:**
- Add `FAST_BOAT_GUN` and `FAST_BOAT_SUICIDE` entries to `enemyIntel.js` with stats, description, and counter tips
- Add `MINI_SUBMARINE` entry to `enemyIntel.js`
- Update `getIntelKey()`: check `unit.isBoat` (→ variant-based key), check `unit.isSub` (→ `MINI_SUBMARINE`)
- All fields: name, icon, type, color, maxHP, stats array, desc, counter

---

## 4. Coalition Submarine Patrol Behavior

**Problem:** Sub follows ship routes and self-destructs at the end. Should patrol the bay.

**Design:**
- Override `update()` in `CoalitionSubmarine` to NOT call `super.update()` (which does route following)
- New behavior states: `PATROL` → `PURSUE` → `PATROL`
- **PATROL:** Pick a random point within `WATER_POLYGON`, move toward it at patrol speed. When reached, pick another.
- **PURSUE:** When enemy detected within sonar range, chase it and fire torpedoes. Return to PATROL when target is destroyed or out of range.
- Remove `onReachedEnd()` override — sub never reaches an "end"
- Sub persists until destroyed by enemy fire
- Keep the wake/sonar visuals as-is

**Patrol point selection:** Random point inside `WATER_POLYGON` (use rejection sampling with polygon bounds). Bias toward the central strait area (where threats are) rather than far corners.

---

## 5. Ships Take Closest Route + More Routes

**Problem:** Random route selection ignores click position. Only 4 routes exist.

**Design:**
- Add 4 new routes in `zones.js` (total 8):
  - Route E: Far south coastal hug (Oman side, safest, longest)
  - Route F: North-central weave (between islands)
  - Route G: Mid-channel direct (fastest, most exposed)
  - Route H: Southern island passage
- `GameScene.deployShip()`: Calculate distance from click (x,y) to each route's start point. Pick the closest route. If two routes tie (within 50px), randomly pick between them for variety.
- Ships still spawn at the route's start position (not at click position) — the click just influences which route.

---

## 6. Game Over Screen Polish

**Problem:** Bulk fade-in causes visual glitches (hit-rects visible, wrong alphas). Design is dense.

**Design:**
- **Fix `_targetAlpha` bug:** Replace the catch-all `delayedCall` with explicit per-element tweens at specific delays. Each element gets its own fade with the correct target alpha.
- **Visual improvements:**
  - Add subtle animated background (slow map pan or parallax vignette)
  - Larger, more dramatic stamp with slight rotation animation
  - Better vertical spacing between stat sections
  - Staggered reveal: ticker → title → stats → leaderboard → buttons (each 300ms apart)
  - Pulsing accent glow on the card border
- **Hit-area rectangles:** Never set alpha on these — keep at 0 always, rely on `.setInteractive()` for click detection

---

## 7. Share Only Image (No Text)

**Problem:** `navigator.share()` includes `text` and `title` alongside the image file, causing Chrome to show file path + text.

**Design:**
- Remove `title` and `text` from the `navigator.share()` call
- Share only `{ files: [file] }`
- The debrief PNG already contains callsign, score, and outcome — no text needed
- Fallback download path unchanged

---

## File Impact Summary

| File | Changes |
|------|---------|
| `src/config/zones.js` | Add `COALITION_LAND` zone, add 4 new ship routes |
| `src/config/constants.js` | `FAST_BOAT_START_MS` → 180000 |
| `src/config/units.js` | AIR_DEFENSE + AIRFIELD zone → `COALITION_LAND` |
| `src/config/enemyIntel.js` | Add FastBoat + MiniSub intel entries, update `getIntelKey()` |
| `src/entities/CoalitionSubmarine.js` | Replace route-following with patrol behavior |
| `src/scenes/GameScene.js` | Closest-route ship deploy, zone outline updates, banner text |
| `src/scenes/GameOverScene.js` | Fix fade-in bug, visual polish |
| `src/ui/DebriefRenderer.js` | Remove text from share call |
| `src/systems/ZoneManager.js` | Handle new COALITION_LAND zone in flash helpers |
