# Feature: Leaderboard + Sharing

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

There's no social hook after game over. Players have no reason to replay beyond personal satisfaction, and no way to show friends their score.

## Proposal

A leaderboard showing top scores, plus a shareable "results card" image on game over that players can screenshot or download.

## Design

### Gameplay Mechanics
- On game over, prompt for player name (or "ANONYMOUS ADMIRAL")
- Submit score to leaderboard: name + tankers through + survival time
- Show top 20 scores
- Generate a shareable results card

### Visual Design
- Leaderboard: military-style ranked list with green monospace text
- Results card: styled like a classified document with:
  - Satirical headline
  - Score + time
  - Performance rating
  - QR code or URL to play
  - "DECLASSIFIED" watermark
- "DOWNLOAD INTEL REPORT" button saves the card as PNG

### Balance
- N/A (meta-feature)

## Scope

### In Scope
- [ ] localStorage leaderboard (MVP)
- [ ] Shareable results card (canvas → PNG download)
- [ ] Top 20 display on game over screen

### Out of Scope (Phase 1)
- Server-side leaderboard
- Social media sharing API integration
- Anti-cheat

## Dependencies
- Game over screen (shipped)

## Risks
- localStorage is per-browser, not persistent across devices
- Phase 2: server-side via Cloudflare Worker or simple API
