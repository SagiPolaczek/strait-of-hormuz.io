# Feature: Mini-Objectives / Bounties

**Status:** `draft`
**Priority:** `P1`
**Author:** Sagi
**Date:** 2026-04-02

## Problem

During a run, the player's only goal is "survive and push tankers through." There's no secondary goal structure to break up the rhythm. Players who are doing well can enter autopilot; players who are struggling have no small wins to motivate them. Sessions end because players get bored, not because the game ran out of content.

## Proposal

Timed mini-objectives that pop up during gameplay, offering oil rewards for completing specific tasks within a time limit. Creates micro-goals within the macro-goal, giving players a reason to stay "just one more bounty."

## Design

### Gameplay Mechanics

- **Frequency**: New bounty every 45-90 seconds (randomized)
- **Duration**: 30-60 seconds to complete (shown with countdown timer)
- **Only one active bounty at a time** — completing or timing out clears the slot for the next
- **Bounty pool** (randomized, context-aware):

| Bounty | Condition | Reward | Available After |
|--------|-----------|--------|----------------|
| Tower Buster | Destroy 1 IRGC launcher | 200 oil | 1 min |
| Rig Raider | Destroy 1 IRGC oil rig | 150 oil | 1 min |
| Mine Sweeper | Clear 2 mines | 180 oil | 2 min |
| Swarm Breaker | Destroy 5 fast boats | 250 oil | 3 min |
| Safe Passage | Get a tanker through without damage | 300 oil | 0 min |
| Drone Hunter | Intercept 2 UAVs | 200 oil | 3 min |
| Missile Shield | Intercept 1 cruise missile | 250 oil | 3 min |
| Speed Run | Score a tanker within 45 seconds | 350 oil | 1 min |
| Economy Boom | Collect 100 oil from rigs in 30s | 150 oil | 1 min |
| Sub Hunter | Destroy 1 IRGC submarine | 300 oil | 5 min |

- Context-aware: only offers bounties for enemy types currently on the map
- Completing a bounty gives oil + brief XP bonus (ties into rank system)
- Failing a bounty has NO penalty — just missed opportunity

### Visual Design

- Bounty notification slides in from the right side, military briefing style:
  ```
  ┌─────────────────────────┐
  │ ⚡ INTEL BOUNTY         │
  │ Destroy 1 launcher      │
  │ Reward: 200 🛢️          │
  │ ▓▓▓▓▓▓▓▓░░░░ 0:42      │
  └─────────────────────────┘
  ```
- Timer bar depletes left-to-right (green → yellow → red)
- On completion: gold flash + "BOUNTY COMPLETE" text + oil reward flies to HUD
- On timeout: brief red flash, notification slides out, "EXPIRED" text
- Sits below the HUD bar, right side — doesn't overlap gameplay

### Balance

- Average bounty reward: ~220 oil (roughly the cost of one tanker)
- Frequency: ~1 per minute means ~5-8 bounties in a typical run
- Total possible bounty oil: ~1000-1800 per run (significant but not dominant income)
- Bounties should feel like a bonus, not the primary income source
- Hard bounties (sub hunter, speed run) have proportionally higher rewards

## Scope

### In Scope
- [ ] Bounty manager system (tracks active bounty, conditions, timer)
- [ ] Bounty notification UI (slide-in panel with timer)
- [ ] 10 bounty types with context-aware selection
- [ ] Completion detection for each bounty condition
- [ ] Reward delivery (oil + visual feedback)
- [ ] Timeout handling

### Out of Scope
- Bounty chains / combos (complete 3 in a row for bonus)
- Player choosing between multiple bounties
- Bounties that require specific unit types ("use a destroyer to...")
- Bounty history / stats tracking

## Dependencies
- Kill tracking — need to detect when specific enemy types are destroyed
- Economy system — for oil reward delivery
- HUD — for notification placement

## Risks
- **Distraction**: Bounties shouldn't pull attention so hard that players forget the main objective. Keep notifications subtle and rewards modest.
- **Impossible bounties**: Context-awareness prevents offering "destroy a sub" when none exist. Edge case: all targets destroyed before bounty timer starts.
- **UI clutter**: Single bounty slot prevents stacking. Notification area is small and unobtrusive.

## Alternatives Considered
- **Permanent side objectives (achievements during run)**: Less urgent, less engaging. The timer creates tension.
- **Choose-your-bounty system**: More agency but adds decision overhead. Random bounties keep it simple and surprising.
