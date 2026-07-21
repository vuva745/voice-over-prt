const CACHE_NAME = "kahare-reel-media-v1";
const MEMORY_LIMIT = 2;

type ProgressCb = (pct: number) => void;

const memory = new Map<string, Blob>();
const inflight = new Map<string, Promise<Blob>>();

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function remember(url: string, blob: Blob) {
  if (memory.has(url)) memory.delete(url);
  memory.set(url, blob);
  while (memory.size > MEMORY_LIMIT) {
    const oldest = memory.keys().next().value;
    if (oldest == null) break;
    memory.delete(oldest);
  }
}

async function readWithProgress(
  response: Response,
  onProgress?: ProgressCb,
): Promise<Blob> {
  const total = Number(response.headers.get("content-length") || 0);
  if (!response.body) {
    return response.blob();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      if (total > 0 && onProgress) {
        onProgress(clampPct((received / total) * 100));
      }
    }
  }

  if (onProgress) onProgress(100);

  const mime = response.headers.get("content-type") || "video/mp4";
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Blob([merged], { type: mime });
}

/** Download a reel into Cache Storage (+ memory). Returns a Blob for smooth local play. */
export async function downloadReel(
  url: string,
  onProgress?: ProgressCb,
): Promise<Blob> {
  const cached = memory.get(url);
  if (cached) {
    onProgress?.(100);
    return cached;
  }

  const existing = inflight.get(url);
  if (existing) return existing;

  const job = (async () => {
    try {
      if (typeof caches !== "undefined") {
        const cache = await caches.open(CACHE_NAME);
        const hit = await cache.match(url);
        if (hit) {
          const blob = await hit.blob();
          remember(url, blob);
          onProgress?.(100);
          return blob;
        }
      }

      onProgress?.(0);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      const clone = res.clone();
      const blobPromise = readWithProgress(res, onProgress);

      if (typeof caches !== "undefined") {
        void caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(url, clone))
          .catch(() => undefined);
      }

      const blob = await blobPromise;
      remember(url, blob);
      return blob;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, job);
  return job;
}

/** Warm the cache in the background (hover / idle). */
export function prefetchReel(url: string) {
  void downloadReel(url).catch(() => undefined);
}

/** Trigger a real file download in the browser. */
export async function saveReelToDisk(url: string, filename: string) {
  const blob = await downloadReel(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
