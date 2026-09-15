# Invoicer by Swaniki

A private, local-first invoice maker for freelancers, consultants and small
businesses. Create professional invoices, share them and get paid — no
sign-up, no cloud. Your data stays on your device.

## Status

- **Milestone 1 (done):** welcome splash, first-run business setup, app shell,
  Home screen, tab skeletons, working Settings (business profile, theme,
  backup export), PWA manifest + icon set + offline service worker, dark mode.
- **Next:** invoice builder (quick + standard), customers, products.

## Stack

- Next.js 16 (App Router, static export via `output: "export"`)
- Tailwind CSS v4
- Dexie (IndexedDB) + dexie-react-hooks — all data stays local
- lucide-react icons
- Deployed as a static site on Vercel

## Commands

```bash
npm run dev        # dev server
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run build      # static export into out/
npm run preview    # serve the out/ build locally
npm run icons      # regenerate PWA PNG icons from app/icon.svg
```

## Deploy

Vercel project `invoicer-by-swaniki` is connected to this repository — every
push to `main` auto-deploys to production. Routing and build overrides live in
[`vercel.json`](vercel.json).

The service worker (`public/sw.js`) is versioned manually; bump its `VERSION`
constant and redeploy to push updates to installed clients.

## Master spec

Product decisions and the full milestone plan live in
[`docs/Swaniki_Invoice_Master_Vibe_Coding_Prompt.md`](docs/Swaniki_Invoice_Master_Vibe_Coding_Prompt.md).