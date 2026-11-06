# STORAGE WARS

Bid on mystery storage units with your friends, in real time, right in the browser. Peek, bluff, and try not to win a unit full of mold.

STORAGE WARS is a free online version of the storage-unit auction card game *Bidder Battle*, for 3 to 7 players. Share a room code, everyone joins from their phone or laptop, and the auction starts.

![Title screen: a storage unit with a roll-up door](docs/screenshots/title.jpg)

## How a game works

Everyone starts with $5,000. Each round one player is the **Auctioneer** and the others bid on a **storage unit** full of face-down items.

- **Buy in** for $100 to join the auction (the Auctioneer keeps it), or pass.
- **Peek** at a crate or watch the Auctioneer flip one, depending on how big the unit is. Peeks are private: only you see what you peeked at.
- **Bid** in steps of $100. When the bidding stops, the Auctioneer calls "going once, going twice, SOLD!".
- The winner **pays** with cash or items they already won, and opens the unit. Junk costs you money, valuables pay off, and a **Havoc** card wipes out the whole unit, so you paid for nothing.
- If the winner can't pay, they take a $1,000 fine and the auction restarts without them.
- Everyone is Auctioneer twice. The richest player (cash plus item values) wins.

The Auctioneer can be **Manual** (a real player runs the auction) or **Auto** (the server runs it), chosen per room.

![Lobby with room code and players](docs/screenshots/lobby.jpg)

![The auction table: bidding, a peeked crate and a flipped crate](docs/screenshots/table.jpg)

## The cards

56 item cards (junk, common, valuable, unique and Havoc) and 16 storage units, every one hand-drawn as vector art. Values are tuned in one file and balance-tested with a bot simulation.

![A page of valuable item cards](docs/screenshots/cards.jpg)

## Features

- Realtime play over WebSockets, with a 4-letter room code and an invite link
- Hidden information is enforced on the server: your browser never receives a card you are not allowed to see
- Manual or Auto Auctioneer, timers for every waiting phase, and rejoin after a dropped connection
- Works on phones and laptops, with synthesized sound effects and a mute switch
- No accounts, no database: rooms live in memory

## Run it locally

Needs Node 20 or newer.

```bash
npm install
npm start        # http://localhost:3000
npm test         # rules engine, rooms, realtime, UI markup and art checks
```

## Put it online for free

See [DEPLOY.md](DEPLOY.md). It covers a free Render web service and a no-account option that runs from your own computer.

## Project layout

| Path | What |
|---|---|
| `shared/cards.js` | The 56 items and 16 storage units (edit values here) |
| `server/game/` | The rules engine: pure functions, fully tested |
| `server/rooms.js`, `server/index.js` | Rooms, lobby and the Socket.IO server |
| `client/` | The browser game: plain ES modules, SVG art, synthesized sound |
| `client/dev/art-sheet.html` | Contact sheet of every card (open it while the server runs) |
| `tools/dev-bots.js` | Dev only: joins a room as scripted guests so one person can test alone |
| `tools/balance-sim/sim.py` | The simulation used to balance the deck |
| `docs/qa-checklist.md` | What was checked by hand before release |

## Credits

An unofficial fan project inspired by the tabletop game *Bidder Battle* by Running Innovation. All artwork, code and card text here are original.
