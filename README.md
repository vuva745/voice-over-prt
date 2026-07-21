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

## Deploy (Vercel)

Reels are stored with **Git LFS**. Vercel must pull LFS objects or it will serve tiny pointer files and videos will not play.

1. Open your project on Vercel → **Settings** → **Git**
2. Enable **Git Large File Storage (LFS)**
3. **Redeploy** the latest commit (required after toggling LFS)

Docs: [Vercel Git LFS](https://vercel.com/docs/project-configuration/git-settings#git-large-file-storage-lfs)

## Customize

- Brand name and copy: `src/components/PortfolioApp.tsx`
- Email: update the contact mailto link in the same file
- Colors / type: `src/app/globals.css` and `src/app/layout.tsx`
