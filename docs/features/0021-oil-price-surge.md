# Feature: Oil Price Surge Mechanic

**Status:** `draft`
**Priority:** `P1`
**Author:** Claude (news-driven)
**Date:** 2026-04-01
**Rank:** #5 of 10 (news-inspired batch)
**Inspired by:** Brent crude surged from ~$75 to $126/barrel during the March 2026 Hormuz crisis. Every blocked tanker raised global oil prices in real-time.

## Problem

Currently, oil income is flat — rigs produce at a fixed rate, tanker bonuses are fixed. There's no economic feedback loop that mirrors the real-world dynamic where blocking oil shipments makes remaining oil MORE valuable. The game economy feels static.

## Proposal

A **live oil price ticker** that rises as the conflict escalates and tankers are lost. Each tanker destroyed/captured raises the global oil price. Each tanker that gets through is worth MORE oil when prices are high. This creates a risk/reward feedback loop: the worse things get, the more each successful delivery matters.

## Design

### Gameplay Mechanics
- Oil price starts at 1.0x multiplier (baseline)
- **Price goes UP when**: tanker is destroyed (+0.15x), tanker is captured (+0.1x), time passes (+0.02x per minute)
- **Price goes DOWN when**: tanker reaches exit (-0.05x), coalition destroys IRGC assets (-0.02x per kill)
- Price range: 1.0x to 3.0x
- **All oil income is multiplied by current price**: rig production, tanker delivery bonus, everything
- Displayed as a stock-ticker style widget in the HUD

### Visual Design
- Small ticker in the HUD showing "OIL: $XXX /bbl" with price graph
- Price text color: green when low (cheap), amber when medium, red when high (crisis)
- Price change flashes: "+$X" in red when price spikes, "-$X" in green when it drops
- At 2.0x+: "PRICE SURGE" warning banner
- At 3.0x: "CRISIS" flashing, screen edge amber tint
- Mini line chart showing price history (last 60 seconds)

### Balance
- At 1.0x: tanker bonus = 500 oil (normal)
- At 2.0x: tanker bonus = 1000 oil (crisis pricing makes deliveries huge)
- At 3.0x: tanker bonus = 1500 oil (massive reward for getting through)
- This means losing tankers early paradoxically funds a comeback — but only if you can GET tankers through at the higher price
- Rig income also scales, so the player always has some benefit from high prices

## Scope

### In Scope
- [ ] Oil price multiplier system (events that raise/lower it)
- [ ] Apply multiplier to all oil income
- [ ] HUD ticker widget (price, mini chart, flash effects)
- [ ] Visual urgency effects at high price levels

### Out of Scope
- Real-world data feed (obviously)
- Player trading/speculation mechanics
- Different prices for different resources
