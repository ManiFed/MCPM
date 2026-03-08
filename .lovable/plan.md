

# Leveraged Prediction Market Simulator

## Overview
A dark, terminal-style Monte Carlo simulator for evaluating leveraged positions on prediction markets. Users input a market probability (via link or manual entry), configure leverage and risk parameters, and get rich visualizations of simulated outcomes plus AI-generated bull/bear arguments.

## Design
- **Dark, technical aesthetic** — dark backgrounds, monospace accents, neon green/amber/red color coding for profit/neutral/loss
- **Single-page app** with collapsible input panel on the left and a rich results dashboard on the right

---

## Features

### 1. Market Input
- **Manual entry**: Slider or text input for base probability (0–100%)
- **Paste link**: Accept Polymarket, Metaculus, or Manifold URLs → use Firecrawl (via edge function) to scrape the current probability from the page
- Display extracted market title and current probability with a confirmation step

### 2. Simulation Parameters
- **Leverage slider**: 1x–10x with preset buttons (2x, 3x, 5x, 10x)
- **Risk tolerance**: Conservative / Moderate / Aggressive (maps to position sizing — e.g., % of bankroll per bet)
- **Number of simulations**: 1,000 / 10,000 / 50,000 runs
- **Bankroll**: Starting capital input

### 3. Monte Carlo Engine (client-side JS)
- Runs simulations in the browser using Web Workers to avoid UI blocking
- Each run simulates repeated bets at the given probability and leverage
- Calculates per-run equity curves and final outcomes

### 4. Results Dashboard (Rich Visualizations)
- **Summary stats panel**: Expected value, median outcome, Sharpe-like ratio, max drawdown
- **Probability of ruin gauge**: Animated circular gauge showing % chance of going to zero
- **Outcome distribution chart**: Histogram of final portfolio values across all simulations (Recharts)
- **Equity curve fan chart**: Spaghetti plot of Monte Carlo paths with 5th/25th/50th/75th/95th percentile bands highlighted
- **Confidence intervals table**: Key percentiles (1%, 5%, 25%, 50%, 75%, 95%, 99%) with color coding
- **Risk/reward scatter**: Expected return vs. probability of ruin at different leverage levels

### 5. AI Bull/Bear Agent (Lovable AI via Edge Function)
- After simulation results are generated, a "Get AI Analysis" button triggers the AI
- Sends the simulation parameters and summary stats to an edge function
- AI returns a structured **bull case** and **bear case** argument for taking the levered position
- Rendered in side-by-side cards with markdown formatting
- Streaming response for real-time feel

### 6. Backend Requirements
- **Lovable Cloud** for edge functions:
  - `firecrawl-scrape`: Scrape prediction market URLs for probability extraction
  - `ai-analysis`: Call Lovable AI to generate bull/bear arguments
- **Firecrawl connector** for market link scraping

