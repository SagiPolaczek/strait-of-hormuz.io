# Feature: F-22 Air Strikes

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

The coalition has no way to go on the offensive against IRGC infrastructure. Destroyers can only shoot launchers within their short range as they pass by. The player is always reactive — defending tankers, never attacking. An air strike capability flips the dynamic and gives the player a satisfying offensive tool.

## Proposal

The player can build an **Airfield** in the coalition deploy zone. Once built, it automatically launches **F-22 fighter jets** that fly across the map, bomb a random IRGC building (oil rig or missile launcher), then return to the airfield to refuel before flying another sortie.

## Design

### Gameplay Mechanics

- **Airfield**: Static building placed in COALITION_DEPLOY zone. Serves as the F-22's home base.
- **F-22 behavior loop**:
  1. Takes off from airfield
  2. Flies toward a random IRGC target (oil rig or missile launcher)
  3. Drops bombs / strafes the target on arrival (high burst damage)
  4. Flies back to airfield
  5. Refuels (cooldown period on the ground)
  6. Repeats — picks a new random target each sortie
- **Target selection**: Random IRGC building each sortie — player can't control which target. This keeps it feeling like air support, not a precision tool.
- **Vulnerability**: The airfield can be destroyed by IRGC missiles/UAVs (from feature 0015). If the airfield is destroyed, the F-22 is lost. Protecting the airfield matters.
- **Unlock**: Available after 3 minutes (same gate as feature 0015), or could be available from the start at a high cost — TBD based on balance.
- **Limit**: One F-22 per airfield. Player can build multiple airfields for more jets.

### Visual Design

- **Airfield**: Rectangular platform with runway markings, control tower, coalition blue accents. Subtle rotating radar dish.
- **F-22**: Small sleek delta-wing silhouette, fast movement, afterburner trail (orange/blue glow behind)
- **Takeoff**: Accelerates along a short path from the airfield, lifts with a speed burst
- **Bombing run**: Diving approach toward target, bomb drop flash, explosion on target, pull-up arc
- **Return**: Flies back at cruise speed, lands with a deceleration
- **Refueling**: F-22 sits on the airfield, a small fuel gauge fills up, then it launches again
- **Shadow**: Subtle shadow on the ground beneath the jet to sell the altitude
- Depth layer above ships/ground units but below HUD

### Balance

| Stat | Value |
|------|-------|
| Airfield cost | 800 oil |
| Airfield HP | 300 |
| F-22 bomb damage | 100 (per sortie) |
| F-22 speed | 250 (fast — should feel like a jet) |
| Refuel time | 15s on the ground |
| Sortie cycle | ~25-30s total (fly out + bomb + fly back + refuel) |

- At 800 oil, the airfield is the most expensive coalition unit — a major investment
- 100 damage per sortie means it takes 2 hits to kill an IRGC launcher (150 HP) or oil rig (200 HP)
- Random targeting means the player can't snipe specific launchers — it's area denial, not surgical
- One jet every ~25s is impactful but not game-breaking
- IRGC can counter by destroying the airfield with missiles/UAVs from feature 0015

## Scope

### In Scope
- [ ] Airfield entity (coalition, player-placed in deploy zone)
- [ ] F-22 entity (auto-pilot: takeoff → fly to target → bomb → return → refuel loop)
- [ ] Random IRGC target selection per sortie
- [ ] Bombing run visual (dive, flash, explosion, pull-up)
- [ ] Afterburner trail and shadow effects
- [ ] Refuel state with visual indicator on the airfield
- [ ] Airfield added to deployment bar
- [ ] Airfield can be destroyed (loses the F-22 with it)

### Out of Scope
- Player-controlled flight path or target selection
- Air-to-air combat (F-22 vs UAVs)
- Multiple jets per airfield
- IRGC fighter jets / dogfights
- F-22 being shot down mid-flight (keep it simple — only the airfield is vulnerable)

## Dependencies
- Deployment bar needs another unit slot
- New entity classes: Airfield, F22
- If gated behind 3-minute unlock, ties into feature 0015's unlock system
- IRGC missiles/UAVs (feature 0015) provide the counter — without them, airfield has no risk

## Risks
- **Too strong if uncountered**: Without IRGC missiles/UAVs (0015), the F-22 would freely demolish IRGC with zero risk. These features should ship together or the F-22 should ship after 0015.
- **Random targeting frustration**: Player might want to hit a specific launcher that's killing their tankers, but the jet goes for a random oil rig instead. This is intentional (air support, not a sniper) but could frustrate. Consider weighted targeting toward launchers.
- **Visual complexity**: A fast-moving jet with trails + bombing explosions adds visual noise. Keep the jet small and effects brief.
- **Airfield placement**: If placed too far from IRGC territory, sortie time increases. If too close, it's vulnerable. This is an interesting player decision.

## Alternatives Considered
- **Player-targeted air strikes (click to bomb)**: More control but removes the fun of watching autonomous sorties. Also makes it too easy to snipe key launchers.
- **One-time use air strike ability (cooldown skill)**: Simpler but less interesting than a persistent airfield + jet loop. The airfield as a building you protect adds depth.
- **Helicopter instead of F-22**: Slower, less dramatic. The F-22 sells the "coalition military superiority" fantasy.
