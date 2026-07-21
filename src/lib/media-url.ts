/** Client-safe URL helper for uploaded reel files. */
export function mediaUrl(filename: string) {
  return `/api/media/${encodeURIComponent(filename)}`;
}
