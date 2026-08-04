# Flat Six Vault — Stage 1 (installable, single device)

This folder is a complete, ready-to-deploy version of your pin tracker. Storage is
local to whatever device/browser you use it on — that upgrades in Stage 2.

## Option A — No terminal, just clicking (recommended for now)

1. **Unzip this folder** somewhere on your computer.
2. **Create a free GitHub account** at github.com if you don't have one.
3. On github.com, click **New repository**. Name it `flat-six-vault`, leave it empty
   (don't add a README there), and click **Create repository**.
4. On the new repo's page, click **Add file → Upload files**, then drag this
   whole unzipped folder's contents (index.html, package.json, vite.config.js,
   the `public` folder, the `src` folder) into the browser window. Click
   **Commit changes**.
5. **Create a free Vercel account** at vercel.com — choose "Continue with GitHub"
   so the two are connected automatically.
6. Click **Add New → Project**, pick your `flat-six-vault` repo, and import it.
   Vercel will detect it's a Vite app automatically — you don't need to change
   any settings. Click **Deploy**.
7. After about a minute you'll get a live link like `flat-six-vault-yourname.vercel.app`.
   Open that link on your phone:
   - **iPhone (Safari):** tap the Share icon → "Add to Home Screen"
   - **Android (Chrome):** tap the ⋮ menu → "Install app" (or it may prompt you automatically)

That's it — Flat Six Vault now has a real icon on your home screen and opens full-screen
like a normal app.

## Option B — Using Claude Code

If you install Claude Code, you can instead just point it at this folder and
say something like: *"Push this to a new GitHub repo and deploy it to Vercel."*
It has real terminal and internet access on your machine, so it can run the
equivalent commands for you (`npm install`, `git init/push`, `vercel deploy`)
instead of you clicking through the web UI.

## What's next (Stage 2)

Right now the catalog and your garage live only in this browser's local storage —
nothing is shared between devices or people yet. Stage 2 swaps that for a real
backend (e.g. Supabase) so the catalog is genuinely shared and each person has
their own account. Come back to the chat where this was built when you're ready
for that step.
