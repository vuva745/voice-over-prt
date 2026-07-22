/** Client-safe URL helper for portfolio reel files (served from /videos). */

const REPO = "vuva745/voice-over-prt";
const BRANCH = "main";

/** True when the site is the Vercel production deploy (needs GitHub LFS CDN). */
function isProductionDeploy() {
  if (typeof window === "undefined") {
    return process.env.VERCEL === "1";
  }
  const host = window.location.hostname;
  return host.endsWith(".vercel.app");
}

/**
 * Local dev (localhost, LAN IP, etc.): static files under /videos.
 * Production on Vercel: GitHub LFS media CDN when deploy serves LFS pointers.
 */
export function mediaUrl(filename: string) {
  const safe = encodeURIComponent(filename);

  if (!isProductionDeploy()) {
    return `/videos/${safe}`;
  }

  return `https://media.githubusercontent.com/media/${REPO}/${BRANCH}/public/videos/${safe}`;
}
