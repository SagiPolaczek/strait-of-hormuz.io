# Feature: Shareable Debrief Image

**Status:** `planned`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

The current share feature copies plain text to clipboard. It's functional but forgettable — no visual impact, no reason for someone to stop scrolling. A beautiful image would drive shares and bring in new players.

## Proposal

When the game ends, generate a **shareable debrief card image** using canvas rendering. The image should be visually striking — satellite map background with the player's final game state overlaid: score, time, outcome, balance meter, performance rating, callsign, and a stylized "CLASSIFIED" or "MISSION COMPLETE" stamp. Military aesthetic, dark tones, green/amber accents. Export as PNG via `canvas.toBlob()` and offer download + native share (Web Share API where available).
