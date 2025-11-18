# Dostotcoin bot

Quick scaffold for the Dostotcoin fake-cryptocurrency Discord bot.

Setup

1. Copy the example env and set your bot token:

```powershell
cd bot
copy .env.example .env
# edit .env and set BOT_TOKEN
```

2. Install dependencies and run:

```powershell
cd bot
npm install
npm start
```

Usage

- The bot responds to text commands that begin with `dst`.
- Example commands:
  - `dst ping` — simple health check
  - `dst balance` — show your Dostotcoin balance
  - `dst coinflip <wager> <h|t>` — bet on a coinflip
  - `dst leaderboard` — top balances

Game channel

- The bot watches for counting in a channel named `the-mineshaft`. When someone posts the next correct integer in sequence they are awarded 1 Dostotcoin. Ensure the channel is named `the-mineshaft` (or change the name check in `src/index.js`).

Data

- Balances and mineshaft state are stored in `bot/data/*.json` (simple JSON storage).
