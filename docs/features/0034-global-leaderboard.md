# Feature: Global Leaderboard

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-02

## Problem

The current leaderboard is localStorage-only — you're only competing with yourself. There's no social pressure, no rivalry, no reason to think "I need to beat that person." Competition is the strongest retention driver for skill-based games, and we have zero of it.

## Proposal

A real-time global leaderboard backed by a lightweight serverless API. Players see where they rank against all other players worldwide. Weekly resets prevent permanent domination and give everyone a fresh shot.

## Design

### Gameplay Mechanics

- **Leaderboard types**:
  1. **All-Time Top 100** — permanent hall of fame
  2. **Weekly Top 50** — resets every Monday 00:00 UTC
  3. **Today's Top 20** — resets daily at 00:00 UTC
- **Score submission**: automatic on game over (both victory and defeat)
- **Submitted data**:
  - Callsign
  - Score (tankers passed)
  - Survival time (seconds)
  - Outcome (victory/defeat)
  - Balance meter final value
  - Rank (from 0031)
  - Timestamp
  - Difficulty (from 0038)
- **Rivalry system**: After each game, show "You beat CAPT. IRONVIPER by 23 seconds" or "RADM. STORMWALL is 2 tankers ahead of you"
- **Percentile**: "You survived longer than 73% of admirals"

### Visual Design

- Debrief screen adds a "GLOBAL RANKING" section below the existing stats
- Leaderboard table in military dossier style with rank insignia
- Your entry highlighted with a glow
- Nearby rivals shown (2 above, 2 below your position)
- Weekly leaderboard shown by default, tabs for Daily / All-Time
- Animated rank counter ("Your rank: #847 → #412") on first load

### Backend

- **Cloudflare Worker + KV** (or D1 SQLite):
  - `POST /api/score` — submit a score
  - `GET /api/leaderboard?type=weekly&limit=50` — fetch leaderboard
  - `GET /api/rank?callsign=X` — get a specific player's rank + nearby rivals
- Rate limiting: max 1 submission per 30 seconds per IP
- Basic anti-cheat: reject scores with impossible values (survival > 60min, score > 100)
- No authentication — callsign is the identity (acceptable for a free game)

### Balance

- Weekly resets keep competition fresh — new players can compete immediately
- All-Time board provides aspirational goals for dedicated players
- Difficulty modifiers (0038) should apply a score multiplier so harder games rank higher
- Percentile display ensures even low-ranking players feel progress

## Scope

### In Scope
- [ ] Score submission API (Cloudflare Worker)
- [ ] Leaderboard fetch API (weekly, daily, all-time)
- [ ] Debrief screen integration (rank display, rival comparison)
- [ ] Leaderboard view screen (accessible from title screen)
- [ ] Percentile calculation
- [ ] Basic rate limiting + value validation

### Out of Scope
- User accounts / authentication
- Friend lists / following
- Anti-cheat beyond basic validation
- Push notifications for rank changes
- Replays / proof of score

## Dependencies
- Debrief screen (0030, shipped)
- Rank system (0031) — for displaying ranks on leaderboard
- Difficulty system (0038) — for score multiplier

## Risks
- **Cheating**: Without authentication, players can submit fake scores. Basic server-side validation (reject impossible values) is sufficient for a free game. If it becomes a problem, add a simple hash-based score verification.
- **Cold start**: Empty leaderboard on launch is demotivating. Seed with 20-30 bot scores at realistic values.
- **Cost**: Cloudflare Worker free tier handles 100K requests/day. More than enough for initial launch.
- **Latency**: Score submission is fire-and-forget (don't block debrief screen). Leaderboard fetch on title screen load.

## Alternatives Considered
- **Firebase Realtime Database**: Heavier dependency, more complex setup. Cloudflare Worker is simpler and free.
- **Peer-to-peer leaderboard**: Doesn't work for a web game without persistent connections.
- **No weekly reset**: Stale leaderboard dominated by early adopters. Resets keep it fresh.
