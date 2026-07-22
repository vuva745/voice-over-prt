# Kahare — Voice Over Portfolio

A local portfolio site for showcasing voice-over reels. Upload videos from the Studio Desk and they appear in your work gallery.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Upload videos

1. Scroll to **Studio desk** (or click **Upload** in the nav).
2. Drop an MP4 / WebM / MOV file (no size limit).
3. Add a title and category, then publish.

Videos live in `src/videos/` and are synced to `public/videos/` on install (`npm run sync:videos`). The catalog is in `data/videos.json`.

## Deploy (Vercel)

Reels are stored with **Git LFS**. Vercel often deploys pointer stubs instead of real MP4s.

This app serves production media from GitHub’s LFS media CDN automatically
(`media.githubusercontent.com`), so videos play without enabling Vercel Git LFS.

Optional: still enable **Git LFS** under Vercel → Settings → Git if you want
`/uploads/...` on the Vercel CDN to work too.

## Customize

- Brand name and copy: `src/components/PortfolioApp.tsx`
- Email: update the contact mailto link in the same file
- Colors / type: `src/app/globals.css` and `src/app/layout.tsx`
