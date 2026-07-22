const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src", "videos");
const dest = path.join(__dirname, "..", "public", "videos");

if (!fs.existsSync(src)) {
  console.warn("[sync-videos] src/videos not found; skip");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });

const files = fs.readdirSync(src).filter((f) => f.toLowerCase().endsWith(".mp4"));
if (files.length === 0) {
  console.warn("[sync-videos] no mp4 files in src/videos");
  process.exit(0);
}

for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}

console.log(`[sync-videos] synced ${files.length} reel(s) to public/videos`);
