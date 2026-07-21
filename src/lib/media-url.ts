/** Client-safe URL helper for uploaded reel files. */

const REPO = "vuva745/voice-over-prt";
const BRANCH = "main";

function isLocalHost() {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV !== "production";
  }
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

/**
 * Local: serve from /uploads (Next static).
 * Production: GitHub LFS media CDN (Vercel often deploys LFS pointers otherwise).
 */
export function mediaUrl(filename: string) {
  const safe = encodeURIComponent(filename);

  if (isLocalHost()) {
    return `/uploads/${safe}`;
  }

  // Real LFS bytes with Accept-Ranges — not the tiny pointer Vercel serves from /uploads.
  return `https://media.githubusercontent.com/media/${REPO}/${BRANCH}/public/uploads/${safe}`;
}
