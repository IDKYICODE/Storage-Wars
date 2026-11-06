# STORAGE WARS

A realtime browser version of the storage-unit auction card game Bidder Battle, for 3 to 7 friends. Bid on hidden units, peek, bluff, and avoid the Havoc cards. Each room picks a Manual Auctioneer (a real player runs the auction) or an Auto one (the computer does).

## Run locally

```bash
npm install
npm start        # http://localhost:3000
npm test         # every test (rules engine, rooms, realtime, UI markup, art)
```

Put it online for free: see [DEPLOY.md](DEPLOY.md).

## Where things are

| Path | What |
|---|---|
| `shared/cards.js` | The 56 items and 16 storage units (edit values here) |
| `server/game/` | The rules engine: pure functions, fully tested |
| `server/rooms.js`, `server/index.js` | Rooms, lobby, Socket.IO wiring |
| `client/` | The browser game: plain ES modules, SVG art, synthesized sound |
| `client/dev/art-sheet.html` | Contact sheet of every card (open it while the server runs) |
| `tools/dev-bots.js` | Dev only: joins a room as scripted guests so one person can test alone |
| `tools/balance-sim/sim.py` | The bot simulation used to balance the deck |
| `docs/qa-checklist.md` | What was checked by hand before release |
