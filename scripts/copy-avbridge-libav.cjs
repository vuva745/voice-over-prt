const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "avbridge", "vendor", "libav");
const dest = path.join(__dirname, "..", "public", "avbridge-libav");

if (!fs.existsSync(src)) {
  console.warn("[copy-avbridge-libav] avbridge vendor not found; skip copy");
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("[copy-avbridge-libav] synced to public/avbridge-libav");
