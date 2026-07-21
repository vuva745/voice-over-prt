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

Videos are saved to `public/uploads/` and listed in `data/videos.json`.

## Customize

- Brand name and copy: `src/components/PortfolioApp.tsx`
- Email: update the contact mailto link in the same file
- Colors / type: `src/app/globals.css` and `src/app/layout.tsx`
