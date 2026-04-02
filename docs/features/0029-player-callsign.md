# Feature: Player Callsign

**Status:** `planned`
**Priority:** `P2`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

The game has no player identity. Leaderboard entries are anonymous, and there's no personal investment in the session. Players can't distinguish their runs from others or feel ownership over their results.

## Proposal

On first launch (or via settings), prompt the player for a **callsign** (military-style name). Store it in localStorage. Display it in the HUD, leaderboard entries, and share text. Keep the input themed — military terminal style, max ~12 characters.
