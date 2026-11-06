# QA checklist (Task 25)

Run against a local server with the dev-only scripted guests (`node tools/dev-bots.js ROOMCODE 2`), one real browser seat, phone preview (375x812) and a wide window. Auto and Manual rooms were both played through.

| Check | Result |
|---|---|
| Whole game plays to the end (lobby, buy-in, peek, bids, call/SOLD, payment, reveal, scoreboard) | Pass (Auto mode, 6 rounds, 3 seats) |
| No horizontal scroll at 375 px (`scrollWidth` equals the viewport) | Pass |
| Action bar stays reachable on a phone (sticky bottom bar) | Pass (needed `overflow-x: clip` on body) |
| Entry screen animation: parallax scene, bulb-chasing marquee, rolling doors, clipboard form | Pass |
| Room code box accepts typing and paste, filters to the room alphabet | Pass |
| Peek and flip: crates tappable only when allowed; private peeks show only to the peeker | Pass |
| Bid buttons, custom bid with the fine warning, call banner | Pass |
| Mute toggle works and is remembered | Pass |
| Reduced-motion media query calms animations | Present in `base.css` |
| Console errors during a full game | The only errors seen were 404s for the browser's automatic `/favicon.ico` request; every script, style and API request returned 200 (checked with resource timing). Fixed by adding an inline favicon. |
| Game over replaces the table with the scoreboard | Pass after fixing a listener bug (see below) |

## Bugs found and fixed in this pass

- **End screen never appeared**: when a listener removed itself during an event (the router swapping from table to end), the removed table listener still ran and repainted over the end screen. Fixed in `client/js/net.js` with a regression test in `test/client-net.test.js`.
- Class-name clashes between card styles and UI styles (`.in`, `.st`, `.warn`) that mispositioned badges and recoloured buttons. Renamed.
- `body { overflow-x: hidden }` silently broke `position: sticky`. Replaced with `overflow-x: clip`.

## Not covered here

- Real phones and real network conditions (the Render free tier cold start in particular): checked after deploy.
- The Manual-mode Auctioneer buttons were exercised by the scripted end-to-end tests, not by hand on a phone.
