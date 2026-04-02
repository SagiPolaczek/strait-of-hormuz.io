# Feature: Trump Oil Shock Events

**Status:** `draft`
**Priority:** `P2`
**Author:** Sagi
**Date:** 2026-04-01

## Problem

The game economy is predictable — oil rigs produce at fixed rates, tanker bonuses are constant. There's no external chaos factor. Real-world oil markets are volatile and heavily influenced by political statements. The game needs random economic disruption events that keep the player on their toes.

## Proposal

At random intervals (mean ~2 minutes, Poisson-distributed), a **Trump figure** appears on screen with a speech bubble containing a random quote. Immediately after, the oil value shifts by a random ±1-10%, affecting all oil income. The quote hints at whether the shift is positive or negative.

## Design

### Gameplay Mechanics

- Timer fires at random intervals: exponential distribution with mean of 120 seconds (so sometimes 30s apart, sometimes 4 minutes)
- When triggered:
  1. Trump figure slides in from the side of the screen
  2. Speech bubble shows a random quote (1-2 seconds)
  3. Oil multiplier shifts by K%, where K is random 1-10, sign is random
  4. Multiplier is applied to ALL oil income (rig production, tanker bonus, collection)
  5. Figure slides out
- Multiplier stacks over multiple events (can compound up or down)
- Multiplier is shown in the HUD near the oil display
- Floor of 0.5x and ceiling of 2.0x to prevent extremes

### Quote Pool

**Positive (oil value goes UP):**
- "We're going to drill, baby, drill!"
- "Oil prices are going to be TREMENDOUS"
- "Nobody knows more about oil than me"
- "The Strait is open for BUSINESS"
- "HUGE deal with the Saudis, oil is going UP"
- "We're putting TARIFFS on Iranian oil!"

**Negative (oil value goes DOWN):**
- "Oil prices are TOO HIGH, I'm fixing it"
- "I just called the Saudis, oil is coming DOWN"
- "We have MORE oil than we know what to do with"
- "DEAL with Iran, oil is going to be very cheap"
- "I'm releasing the strategic reserves, BIGLY"
- "The oil market is RIGGED, I'm fixing it"

### Visual Design

- Trump figure: cartoon/caricature silhouette or simple pixel art, slides in from the bottom-right corner
- Speech bubble: white bubble with bold text, presidential seal or American flag accent
- Appears above the game but below the HUD (depth between game and UI)
- Oil change flash: big "+X%" or "-X%" text in green/red, centered on screen
- HUD oil multiplier badge: small "1.05x" or "0.92x" next to the oil display
- Duration on screen: ~3 seconds total (slide in, quote, slide out)
- Sound effect potential: brief fanfare or "presidential alert" tone (if sound feature 0008 ships)

### Balance

- Mean interval: 120 seconds (exponential distribution)
- Min interval: 30 seconds (cooldown)
- K range: 1% to 10% (uniform random)
- Sign: 50/50 positive/negative
- Multiplier floor: 0.5x (oil can't drop below half value)
- Multiplier ceiling: 2.0x (oil can't more than double)
- Expected value is neutral over time (equal chance up/down), but variance creates excitement

## Scope

### In Scope
- [ ] Random event timer (exponential distribution, mean 120s)
- [ ] Trump figure sprite/graphic (simple caricature)
- [ ] Speech bubble with random quote from pool
- [ ] Oil multiplier system (applied to all oil income)
- [ ] Multiplier display in HUD
- [ ] Flash effect showing the percentage change
- [ ] Slide-in/slide-out animation

### Out of Scope
- Other political figures / world leaders
- Player interaction with the figure (can't click/dismiss)
- Quotes affecting anything other than oil value
- Real tweet integration

## Dependencies
- Oil income system (EconomyManager) needs to support a global multiplier
- HUD needs space for multiplier display

## Risks
- **Tone**: Keep it lighthearted and satirical, not mean-spirited. The quotes should be funny, not political commentary.
- **Frustration**: A big negative swing at a critical moment could feel unfair. The floor (0.5x) and relatively small swings (1-10%) mitigate this.
- **Frequency**: Too frequent = annoying. Too rare = forgettable. The 2-minute mean with exponential distribution gives good variance.

## Alternatives Considered
- **Generic "news event" instead of Trump**: Less funny, less memorable. The Trump figure is instantly recognizable and fits the satirical tone.
- **Player can choose to accept/reject the deal**: Adds complexity without much fun. The chaos of random swings IS the fun.
- **Affects balance meter instead of oil**: Too impactful on win/lose condition. Oil income is the right lever — meaningful but not game-ending.
