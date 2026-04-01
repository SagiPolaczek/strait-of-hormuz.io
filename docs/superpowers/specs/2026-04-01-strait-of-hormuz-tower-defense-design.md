# Strait of Hormuz Tower Defense — Game Design Spec

**Date:** 2026-04-01
**Status:** Approved

## Overview

A browser-based tug-of-war RTS game set in the Strait of Hormuz. The player commands a coalition fleet trying to push oil tankers through the strait, while an AI-controlled IRGC builds defenses to stop them. Both sides share an oil-based economy. The game uses the real satellite image of the strait as its map, with cartoonish/satirical game elements on top.

## Core Concept

- **Genre:** Tug-of-war RTS with oil economy
- **Player role:** Coalition (US/EU/Arab) — build oil rigs, deploy ships & aircraft to get tankers through the strait
- **Opponent:** AI-controlled IRGC — builds towers, deploys speedboats, lays mines, launches drones
- **Progression:** Endless survival — IRGC escalates over time, compete for leaderboard score
- **Platform:** Browser (Phaser.js), public launch, static hosting
- **Visual style:** Satirical/cartoonish (emoji-style units on real satellite imagery)
- **Monetization:** Free, no monetization

## Map

The game map is the actual satellite image of the Strait of Hormuz (1920x1539 source image), maintaining fixed aspect ratio regardless of window size.

### Zones

All build zones are defined as coded polygons on the satellite image. Players and AI can only place buildings within their designated zones.

| Zone | Location on map | Owner | What can be built |
|------|----------------|-------|-------------------|
| Coalition Oil Zone | Gulf of Oman (southeast water) | Player | Oil rigs |
| Coalition Deploy Zone | Gulf of Oman entry to strait (east) | Player | Ships & aircraft deploy from here |
| IRGC Oil Zone | Persian Gulf (northwest water) | AI | Oil rigs |
| IRGC Coast Zone | Iranian coastline (top of map) | AI | Towers, launchers, docks |
| IRGC Island Zones | Qeshm, Hormuz, Larak, Abu Musa, Greater/Lesser Tunb | AI | Towers, radar, fortifications |
| Kill Zone (The Strait) | Narrow water between Iran and Musandam Peninsula | Contested | Mines (IRGC), ships pass through (Coalition) |

### Key Geographic Features

- **Iran** — top of map, curving coastline. IRGC builds defenses along coast.
- **Musandam Peninsula (Oman)** — juts up from the bottom-center, creating the chokepoint.
- **UAE** — bottom-left coastline.
- **Qeshm Island** — largest island, near Iran. Major IRGC fortification point.
- **Hormuz Island** — smaller island east of Qeshm. Tower placement.
- **Larak Island** — further east. Radar/tower placement.
- **Abu Musa** — further out in the gulf. Mine layer outpost.
- **Greater/Lesser Tunb** — small islands, minor fortification points.

## Economy

Oil is the single resource for both sides.

### Coalition (Player)
- Starts with a base amount of oil
- Builds **oil rigs** in the Gulf of Oman to generate oil over time
- Spends oil to deploy ships and aircraft
- Earns bonus oil when tankers successfully pass through the strait

### IRGC (AI)
- Starts with a base amount of oil
- Builds **oil rigs/refineries** in the Persian Gulf to generate oil over time
- Spends oil to build towers, deploy speedboats, lay mines, launch drones
- AI economy scales with difficulty — production rate increases over time

### The Tension
Invest in more rigs (long-term growth) or spend oil on military units now? Meanwhile the IRGC is building up. Tankers that make it through give bonus oil — risk vs reward.

## Coalition Units (Player)

| Unit | Icon | Oil Cost | Speed | HP | Role |
|------|------|----------|-------|----|------|
| Oil Rig | 🛢️ | 500 | Static | High | Generates oil over time. Placed in coalition water zone only. |
| Tanker | ⛽ | 200 | Slow | Medium | Send through the strait. Each successful passage = big oil bonus + score. Core scoring unit. |
| Destroyer | 🛥️ | 350 | Medium | High | Armed escort. Shoots at incoming speedboats and missiles. |
| Minesweeper | 🧹 | 250 | Slow | Medium | Clears mines in its path. Essential for opening safe routes. |
| Decoy Ship | 🎯 | 100 | Fast | Low | Cheap bait. Draws missile fire away from tankers. |
| Fighter Jet | ✈️ | 600 | Fast | Low | Flies over strait, bombs a single IRGC tower. One-use strike. |
| Helicopter | 🚁 | 400 | Medium | Medium | Patrols an area, shoots speedboats. Stays on map for a duration. |

### Player Actions (Real-Time, Continuous)
- Build oil rigs in coalition zone
- Deploy ships from coalition deploy zone — they travel through the strait
- Route ships by clicking waypoints on the map (click to add waypoint, ship follows the path)
- Deploy aircraft to attack IRGC towers directly
- Activate countermeasures/special abilities on cooldown (flares, chaff, smoke screen)
- Reroute ships in real-time

## IRGC Buildings & Units (AI)

| Building/Unit | Icon | Role |
|---------------|------|------|
| Oil Rig | 🛢️ | Generates oil for the AI. Built in Persian Gulf zone. |
| Missile Launcher | 🚀 | Fires homing missiles at ships passing through the strait. Placed on coast/islands. |
| Radar Station | 📡 | Extends detection and firing range of nearby towers. Reveals decoy ships. |
| Mine Layer | 💣 | Drops invisible naval mines in the strait water. Ships that hit them take heavy damage. |
| AA Gun | 🔫 | Shoots down coalition aircraft (fighters, helicopters). Protects nearby towers. |
| Speedboat Dock | 🏗️ | Spawns swarms of fast attack boats that ram into ships. |
| Drone Launcher | 🤖 | Sends suicide drones. Cheap, hard to intercept, low damage per hit. |

### IRGC AI Escalation Timeline

The AI gets progressively more dangerous over time:

| Time | Difficulty | AI Behavior |
|------|-----------|-------------|
| 0–2 min | Easy | Basic missile launchers on nearest island. A few scattered mines. |
| 2–5 min | Medium | Adds radar stations, speedboat docks, more launchers spread across islands. |
| 5–10 min | Hard | AA guns appear (countering aircraft), drone launchers, island fortification intensifies. |
| 10+ min | Extreme | Everything maxed. Constant speedboat swarms, dense minefields, overlapping missile coverage. Pure survival. |

## UI Layout

All UI is overlaid on the satellite map.

- **Top bar (HUD):** Oil counter, ships passed count, survival timer, threat level indicator
- **Bottom bar:** Unit deployment buttons with oil costs. Click a button, then click on the map to place/deploy.
- **Center:** The game — satellite image with all units, buildings, animations, and combat
- **Game over screen:** Results card with stats + satirical headline for sharing

## Scoring & Leaderboard

- **Primary score:** Total oil value of tankers that successfully passed through the strait
- **Secondary metric:** Survival time
- **Game over condition:** All oil rigs destroyed + oil reaches 0 + no surviving ships
- **Leaderboard:** Name + score + survival time (localStorage for POC, simple backend later)

## Viral Mechanics

- **Shareable game-over card:** On death, show a results card with satirical headline (e.g., *"Admiral [name] got 12 tankers through before the IRGC said no"*). Designed for screenshots.
- **Leaderboard competition:** High scores create social pressure to retry and share.
- **Satirical tone:** Cartoonish emoji-style warfare on real satellite imagery creates a jarring, meme-able contrast.

## Tech Stack

- **Game engine:** Phaser.js 3 (scene management, arcade physics, tweens, particles, sprites)
- **Map background:** Real satellite image (MODIS), embedded as game background with fixed aspect ratio
- **Hosting:** Static site — Vercel, Netlify, or GitHub Pages
- **Leaderboard (POC):** localStorage. Future: Cloudflare Worker or simple API.
- **Build:** Vite for bundling

## POC Scope

The proof-of-concept should demonstrate:

1. Satellite map as game background with correct aspect ratio
2. Coalition zone — place oil rigs, see oil generating
3. Deploy tankers that sail through the strait
4. IRGC AI places missile launchers on islands that fire at ships
5. Ships can be destroyed, tankers that pass through add score
6. Basic HUD (oil, score, timer)
7. Unit deployment bar
8. Game over screen with score

**Out of scope for POC:** Leaderboard backend, all 7 unit types (start with 3-4), advanced AI escalation, sound, mobile optimization, sharing cards.
