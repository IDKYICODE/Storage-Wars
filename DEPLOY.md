# Putting STORAGE WARS online for free

You do not need to spend any money. There are two free ways; pick one.

## Option A: Render (always on a public link, free)

Render's free web service costs $0 and supports the realtime connection the game needs.

**Important: never add a payment method on Render.** If you ever used up a free allowance (750 instance hours, 5 GB bandwidth or 500 build minutes a month), Render would pause the service instead of charging you. This game uses a tiny fraction of those limits.

1. **Make an empty GitHub repository.** On github.com click New repository, name it `storage-wars`, leave it empty (no README), and create it. Copy the repository address it shows (it ends in `.git`).
2. **Push this folder to it.** Run these in a terminal inside `C:\WORKPLACE\storage-wars`, replacing the address with yours:

   ```bash
   git remote add origin https://github.com/YOUR-NAME/storage-wars.git
   git push -u origin feat/storage-wars:main
   ```

   (This pushes the finished work as your `main` branch.)
3. **Sign up on Render** with your GitHub account. Choose the **Hobby** workspace (it is $0). Skip any step that asks for a card.
4. **Create the service from the blueprint.** In Render click **New**, then **Blueprint**, pick your `storage-wars` repository and continue. Check that the plan shown is **Free**, then **Apply**.
5. **Wait for the first deploy** (a few minutes). When it says **Live**, open the link at the top of the service page. It looks like `https://storage-wars-xxxx.onrender.com`.
6. **Play.** One person clicks ENTER, then CREATE A ROOM, then COPY INVITE LINK and sends it to friends. They open it, type a name, and the room code is already filled in.

**The one catch:** a free Render service falls asleep after 15 minutes with nobody using it, and wakes up in about a minute. Open the link a couple of minutes before game night. While it wakes the game shows "Waking the server" and your seat is kept.

Later updates: push to `main` again and Render redeploys by itself.

## Option B: run it on your own PC (free, no accounts at all)

Good for a one-off game night. It only works while your computer is on and these commands are running, and the link changes every time.

1. Install Node 20 or newer (nodejs.org) and, once, the free tunnel tool:

   ```bash
   winget install Cloudflare.cloudflared
   ```
2. In `C:\WORKPLACE\storage-wars` run `npm install`, then start the game:

   ```bash
   npm start
   ```
3. In a second terminal run:

   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
4. It prints a link ending in `trycloudflare.com`. Send that to your friends. Closing either terminal ends the game.

Cloudflare's quick tunnels need no account and are meant for testing, so they come with no uptime promise. That is fine for a night with friends.

*Status: the game server part of this option is tested (it starts in production mode and answers its health check). The tunnel step itself has not been tried end to end. If anything looks off when you run it, fix the guide.*

## Tuning the game

Every card value, name and storage unit rule is in one file, `shared/cards.js`. After a game night you can change values there and run `npm test` to confirm the deck is still valid (56 items, 16 units). `tools/balance-sim/sim.py` is the bot simulation the numbers were checked with.
